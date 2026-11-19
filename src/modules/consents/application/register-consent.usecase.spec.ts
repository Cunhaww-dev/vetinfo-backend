import { describe, expect, it } from 'vitest'
import type { GuardianConsent } from '../domain/consent-entity.ts'
import type {
  ConsentPatient,
  ConsentRepository,
} from '../domain/consent-repository.ts'
import { RegisterConsent } from './register-consent.usecase.ts'

class InMemoryConsentRepository implements ConsentRepository {
  consents: GuardianConsent[] = []
  patients: (ConsentPatient & { userId: string })[] = [
    { id: 'thor', guardianId: 'g1', userId: 'vet-a' },
    { id: 'rex', guardianId: null, userId: 'vet-a' },
  ]

  async create(consent: GuardianConsent) {
    this.consents.push(consent)
  }
  async update() {}
  async findById() {
    return null
  }
  async listByPatient() {
    return this.consents
  }
  async findActive(patientId: string, guardianId: string) {
    return (
      this.consents.find(
        (c) =>
          c.patientId === patientId && c.guardianId === guardianId && c.active,
      ) ?? null
    )
  }
  async findPatient(patientId: string, userId: string) {
    return (
      this.patients.find((p) => p.id === patientId && p.userId === userId) ??
      null
    )
  }
}

describe('RegisterConsent', () => {
  const register = (
    repo: ConsentRepository,
    patientId: string,
    userId = 'vet-a',
  ) =>
    new RegisterConsent(repo).execute({ userId, patientId, termVersion: '1' })

  it('o consentimento é do tutor atual do paciente', async () => {
    const repo = new InMemoryConsentRepository()
    const consent = (await register(repo, 'thor')).value as GuardianConsent

    expect(consent.guardianId).toBe('g1')
  })

  it('paciente sem tutor não tem quem consinta', async () => {
    expect(
      (await register(new InMemoryConsentRepository(), 'rex')).value,
    ).toMatchObject({
      code: 'PATIENT_WITHOUT_GUARDIAN',
    })
  })

  it('só um consentimento ativo por tutor e paciente', async () => {
    const repo = new InMemoryConsentRepository()
    await register(repo, 'thor')

    expect((await register(repo, 'thor')).value).toMatchObject({
      code: 'CONSENT_ALREADY_ACTIVE',
    })
  })

  it('paciente de outro usuário não existe', async () => {
    expect(
      (await register(new InMemoryConsentRepository(), 'thor', 'vet-b')).value,
    ).toMatchObject({ code: 'PATIENT_NOT_FOUND' })
  })
})
