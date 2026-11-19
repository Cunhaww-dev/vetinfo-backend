import { describe, expect, it } from 'vitest'
import { Share } from './share-entity.ts'

const DAY_MS = 24 * 60 * 60 * 1000
const inDays = (days: number) => new Date(Date.now() + days * DAY_MS)

function create(overrides: Partial<Parameters<typeof Share.create>[0]> = {}) {
  return Share.create({
    userId: 'user-1',
    type: 'third_party',
    patientIds: ['p1', 'p1', 'p2'],
    code: 'ABCDEFGHJK',
    expiresAt: inDays(7),
    ...overrides,
  })
}

function restore(props: Partial<Parameters<typeof Share.restore>[0]>) {
  const share = create().value as Share
  return Share.restore({ ...share, ...props })
}

describe('Share', () => {
  it('cria o código sem paciente repetido', () => {
    const share = create().value as Share

    expect(share.patientIds).toEqual(['p1', 'p2'])
    expect(share.status()).toBe('active')
  })

  it('o tipo guardian precisa do tutor, e o third_party não pode ter', () => {
    expect(create({ type: 'guardian' }).value).toMatchObject({
      code: 'INVALID_SHARE_GUARDIAN',
    })
    expect(create({ guardianId: 'g1' }).isLeft()).toBe(true)
    expect(create({ type: 'guardian', guardianId: 'g1' }).isRight()).toBe(true)
  })

  it('o prazo fica entre agora e 90 dias', () => {
    expect(create({ expiresAt: inDays(-1) }).value).toMatchObject({
      code: 'INVALID_SHARE_EXPIRATION',
    })
    expect(create({ expiresAt: inDays(91) }).isLeft()).toBe(true)
    expect(create({ expiresAt: inDays(90) }).isRight()).toBe(true)
  })

  it('status: revogado ganha de vencido, que ganha de esgotado', () => {
    const past = inDays(-1)

    expect(restore({ maxUses: 2, usesCount: 2 }).status()).toBe('exhausted')
    expect(
      restore({ expiresAt: past, maxUses: 1, usesCount: 1 }).status(),
    ).toBe('expired')
    expect(restore({ revokedAt: new Date(), expiresAt: past }).status()).toBe(
      'revoked',
    )
    expect(restore({ maxUses: null, usesCount: 500 }).status()).toBe('active')
  })

  it('esgotado ainda entrega arquivo, revogado e vencido não', () => {
    expect(restore({ maxUses: 1, usesCount: 1 }).canServeFiles()).toBe(true)
    expect(restore({ revokedAt: new Date() }).canServeFiles()).toBe(false)
    expect(restore({ expiresAt: inDays(-1) }).canServeFiles()).toBe(false)
  })

  it('revogar não volta', () => {
    const revoked = (create().value as Share).revoke().value as Share

    expect(revoked.status()).toBe('revoked')
    expect(revoked.revoke().value).toMatchObject({
      code: 'SHARE_ALREADY_REVOKED',
    })
  })
})
