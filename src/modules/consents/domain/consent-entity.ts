import { randomUUID } from 'node:crypto'
import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { ConsentAlreadyRevoked } from './errors/consent-already-revoked.ts'
import { InvalidConsentDate } from './errors/invalid-consent-date.ts'

type CreateConsentInput = {
  userId: string
  guardianId: string
  patientId: string
  termVersion: string
  acceptedAt: Date
  notes?: string | null | undefined
}

type RestoreConsentProps = {
  id: string
  userId: string
  guardianId: string
  patientId: string
  termVersion: string
  acceptedAt: Date
  revokedAt: Date | null
  notes: string | null
  createdAt: Date
}

// Autorização do tutor para compartilhar o paciente com terceiros (estudo).
// Nunca é apagada nem editada: revogar cria o registro da revogação (revokedAt).
export class GuardianConsent {
  private constructor(
    readonly id: string,
    readonly userId: string, // o veterinário que registrou
    readonly guardianId: string, // quem autorizou
    readonly patientId: string,
    readonly termVersion: string, // a versão do termo que o tutor aceitou
    readonly acceptedAt: Date,
    readonly revokedAt: Date | null,
    readonly notes: string | null,
    readonly createdAt: Date,
  ) {}

  get active(): boolean {
    return this.revokedAt === null
  }

  static create(
    input: CreateConsentInput,
  ): Either<DomainError, GuardianConsent> {
    if (input.acceptedAt.getTime() > Date.now())
      return left(new InvalidConsentDate())

    return right(
      new GuardianConsent(
        randomUUID(),
        input.userId,
        input.guardianId,
        input.patientId,
        input.termVersion.trim(),
        input.acceptedAt,
        null,
        input.notes?.trim() || null,
        new Date(),
      ),
    )
  }

  // Sem volta: um consentimento revogado não volta a valer. O tutor assina um novo.
  revoke(): Either<DomainError, GuardianConsent> {
    if (!this.active) return left(new ConsentAlreadyRevoked(this.id))

    return right(GuardianConsent.restore({ ...this, revokedAt: new Date() }))
  }

  static restore(props: RestoreConsentProps): GuardianConsent {
    return new GuardianConsent(
      props.id,
      props.userId,
      props.guardianId,
      props.patientId,
      props.termVersion,
      props.acceptedAt,
      props.revokedAt,
      props.notes,
      props.createdAt,
    )
  }
}
