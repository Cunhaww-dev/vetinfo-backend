import { describe, expect, it } from 'vitest'
import { GuardianConsent } from './consent-entity.ts'

function create(acceptedAt = new Date()) {
  return GuardianConsent.create({
    userId: 'user-1',
    guardianId: 'guardian-1',
    patientId: 'patient-1',
    termVersion: ' 1 ',
    acceptedAt,
  })
}

describe('GuardianConsent', () => {
  it('nasce ativo', () => {
    const consent = create().value as GuardianConsent

    expect(consent.active).toBe(true)
    expect(consent.termVersion).toBe('1')
  })

  it('recusa aceite no futuro', () => {
    expect(create(new Date('2099-01-01')).value).toMatchObject({
      code: 'INVALID_CONSENT_DATE',
    })
  })

  it('revogar preenche o revokedAt e não volta', () => {
    const revoked = (create().value as GuardianConsent).revoke()
      .value as GuardianConsent

    expect(revoked.active).toBe(false)
    expect(revoked.revokedAt).toBeInstanceOf(Date)
    expect(revoked.revoke().value).toMatchObject({
      code: 'CONSENT_ALREADY_REVOKED',
    })
  })
})
