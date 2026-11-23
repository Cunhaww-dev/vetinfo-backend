import { beforeEach, describe, expect, it } from 'vitest'
import { Share } from '../domain/share-entity.ts'
import type {
  SharePatient,
  ShareRepository,
  ShareUse,
  ShareVisitor,
} from '../domain/share-repository.ts'
import type {
  SharedPatient,
  SharedRecordReader,
} from '../domain/shared-record-reader.ts'
import { AccessShare } from './access-share.usecase.ts'
import { CreateShare } from './create-share.usecase.ts'

// Repositório em memória: testa a regra do use case sem banco
class InMemoryShareRepository implements ShareRepository {
  shares: Share[] = []
  uses: (ShareVisitor & { shareId: string })[] = []
  patients: (SharePatient & { userId: string })[] = []
  guardians: { id: string; userId: string }[] = []
  consented = new Set<string>() // "patientId:guardianId"

  async create(share: Share) {
    this.shares.push(share)
  }
  async update(share: Share) {
    this.shares = this.shares.map((s) => (s.id === share.id ? share : s))
  }
  async findById(id: string, userId: string) {
    return this.shares.find((s) => s.id === id && s.userId === userId) ?? null
  }
  async listByUser(userId: string) {
    return this.shares.filter((s) => s.userId === userId)
  }
  async listUses(): Promise<ShareUse[]> {
    return []
  }
  async findByCode(code: string) {
    return this.shares.find((s) => s.code === code) ?? null
  }
  async codeExists(code: string) {
    return this.shares.some((s) => s.code === code)
  }
  async recordUse(shareId: string, visitor: ShareVisitor) {
    this.uses.push({ shareId, ...visitor })
  }
  async findPatients(ids: string[], userId: string) {
    return this.patients.filter(
      (p) => ids.includes(p.id) && p.userId === userId,
    )
  }
  async guardianExists(guardianId: string, userId: string) {
    return this.guardians.some(
      (g) => g.id === guardianId && g.userId === userId,
    )
  }
  async withActiveConsent(patients: SharePatient[]) {
    return new Set(
      patients
        .filter((p) => this.consented.has(`${p.id}:${p.guardianId}`))
        .map((p) => p.id),
    )
  }
}

class FakeReader implements SharedRecordReader {
  lastRead: { patientIds: string[]; hideMicrochip: boolean } | null = null

  async read(
    patientIds: string[],
    _ownerId: string,
    options: { hideMicrochip: boolean },
  ) {
    this.lastRead = { patientIds, ...options }
    return patientIds.map((id) => ({ id }) as SharedPatient)
  }
  async findAttachment() {
    return null
  }
}

const visitor = { ipAddress: '127.0.0.1', userAgent: 'test' }

describe('CreateShare e AccessShare', () => {
  let repo: InMemoryShareRepository
  let reader: FakeReader

  beforeEach(() => {
    repo = new InMemoryShareRepository()
    reader = new FakeReader()
    repo.guardians = [{ id: 'g1', userId: 'vet-a' }]
    repo.patients = [
      { id: 'thor', guardianId: 'g1', userId: 'vet-a' },
      { id: 'mel', guardianId: 'g2', userId: 'vet-a' },
      { id: 'rex', guardianId: null, userId: 'vet-a' },
      { id: 'bob', guardianId: 'g1', userId: 'vet-b' },
    ]
  })

  const create = (input: Record<string, unknown>) =>
    new CreateShare(repo).execute({
      userId: 'vet-a',
      type: 'third_party',
      patientIds: ['thor'],
      ...input,
    } as Parameters<CreateShare['execute']>[0])

  it('paciente de outro usuário não existe', async () => {
    const result = await create({ patientIds: ['bob'] })

    expect(result.value).toMatchObject({ code: 'PATIENT_NOT_FOUND' })
  })

  it('estudo sem consentimento do tutor atual é bloqueado', async () => {
    repo.consented.add('mel:g1') // consentimento de um tutor antigo não vale

    expect((await create({ patientIds: ['mel'] })).value).toMatchObject({
      code: 'CONSENT_REQUIRED',
    })
    expect((await create({ patientIds: ['rex'] })).value).toMatchObject({
      code: 'CONSENT_REQUIRED',
    })
  })

  it('código do tutor só leva os animais dele', async () => {
    const result = await create({
      type: 'guardian',
      guardianId: 'g1',
      patientIds: ['thor', 'mel'],
    })

    expect(result.value).toMatchObject({ code: 'PATIENT_NOT_FROM_GUARDIAN' })
  })

  it('o tutor de outro usuário não existe', async () => {
    repo.guardians = [{ id: 'g1', userId: 'vet-b' }]
    const result = await create({ type: 'guardian', guardianId: 'g1' })

    expect(result.value).toMatchObject({ code: 'GUARDIAN_NOT_FOUND' })
  })

  it('sem prazo, o código vale 7 dias', async () => {
    repo.consented.add('thor:g1')
    const share = (await create({})).value as Share

    const days = (share.expiresAt.getTime() - Date.now()) / 86_400_000
    expect(Math.round(days)).toBe(7)
  })

  it('cada acesso fica registrado, sem limite de usos', async () => {
    repo.consented.add('thor:g1')
    const share = (await create({})).value as Share
    const access = new AccessShare(repo, reader)

    // O código digitado em minúsculas também vale
    expect(
      (
        await access.execute({ code: share.code.toLowerCase(), visitor })
      ).isRight(),
    ).toBe(true)

    // O repositório em memória não conta os usos sozinho: o banco conta
    await repo.update(Share.restore({ ...share, usesCount: 50 }))

    expect(
      (await access.execute({ code: share.code, visitor })).isRight(),
    ).toBe(true)
    expect(repo.uses).toHaveLength(2)
  })

  it('no estudo, o microchip fica de fora e o consentimento revogado esconde o paciente', async () => {
    repo.consented.add('thor:g1')
    const share = (await create({})).value as Share
    const access = new AccessShare(repo, reader)

    await access.execute({ code: share.code, visitor })
    expect(reader.lastRead).toEqual({
      patientIds: ['thor'],
      hideMicrochip: true,
    })

    repo.consented.delete('thor:g1')
    expect(
      (await access.execute({ code: share.code, visitor })).value,
    ).toMatchObject({
      code: 'SHARE_NOT_AVAILABLE',
    })
  })

  it('código revogado não abre', async () => {
    repo.consented.add('thor:g1')
    const share = (await create({})).value as Share
    await repo.update(share.revoke().value as Share)

    const result = await new AccessShare(repo, reader).execute({
      code: share.code,
      visitor,
    })

    expect(result.value).toMatchObject({ code: 'SHARE_NOT_AVAILABLE' })
    expect(repo.uses).toHaveLength(0)
  })
})
