import type { Request, Response } from 'express'
import type { AuthLocals } from '../../../shared/http/ensure-authenticated.middleware.ts'
import type { ListConsents } from '../application/list-consents.usecase.ts'
import type { RegisterConsent } from '../application/register-consent.usecase.ts'
import type { RevokeConsent } from '../application/revoke-consent.usecase.ts'
import type { GuardianConsent } from '../domain/consent-entity.ts'

type PatientParams = { patientId: string }
type ConsentParams = { consentId: string }

function toHttp(consent: GuardianConsent) {
  return {
    id: consent.id,
    guardianId: consent.guardianId,
    patientId: consent.patientId,
    termVersion: consent.termVersion,
    acceptedAt: consent.acceptedAt.toISOString(),
    revokedAt: consent.revokedAt?.toISOString() ?? null,
    active: consent.active,
    notes: consent.notes,
    createdAt: consent.createdAt.toISOString(),
  }
}

export class ConsentController {
  constructor(
    private readonly registerConsent: RegisterConsent,
    private readonly listConsents: ListConsents,
    private readonly revokeConsent: RevokeConsent,
  ) {}

  register = async (
    req: Request<PatientParams>,
    res: Response<unknown, AuthLocals>,
  ) => {
    const { acceptedAt } = req.body
    const result = await this.registerConsent.execute({
      ...req.body,
      acceptedAt: acceptedAt ? new Date(acceptedAt) : undefined,
      userId: res.locals.userId,
      patientId: req.params.patientId,
    })
    if (result.isLeft()) throw result.value

    return res.status(201).json(toHttp(result.value))
  }

  list = async (
    req: Request<PatientParams>,
    res: Response<unknown, AuthLocals>,
  ) => {
    const result = await this.listConsents.execute({
      userId: res.locals.userId,
      patientId: req.params.patientId,
    })
    if (result.isLeft()) throw result.value

    return res.status(200).json(result.value.map(toHttp))
  }

  revoke = async (
    req: Request<ConsentParams>,
    res: Response<unknown, AuthLocals>,
  ) => {
    const result = await this.revokeConsent.execute({
      userId: res.locals.userId,
      consentId: req.params.consentId,
    })
    if (result.isLeft()) throw result.value

    return res.status(200).json(toHttp(result.value))
  }
}
