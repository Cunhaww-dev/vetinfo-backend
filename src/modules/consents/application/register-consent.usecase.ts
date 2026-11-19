import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { PatientNotFound } from '../../patients/domain/errors/patient-not-found.ts'
import { GuardianConsent } from '../domain/consent-entity.ts'
import type { ConsentRepository } from '../domain/consent-repository.ts'
import { ConsentAlreadyActive } from '../domain/errors/consent-already-active.ts'
import { PatientWithoutGuardian } from '../domain/errors/patient-without-guardian.ts'

type RegisterConsentInput = {
  userId: string
  patientId: string
  termVersion: string
  acceptedAt?: Date | undefined
  notes?: string | null | undefined
}

// O veterinário registra que o tutor atual do paciente assinou o termo
export class RegisterConsent {
  constructor(private readonly consents: ConsentRepository) {}

  async execute(
    input: RegisterConsentInput,
  ): Promise<Either<DomainError, GuardianConsent>> {
    const patient = await this.consents.findPatient(
      input.patientId,
      input.userId,
    )
    if (!patient) return left(new PatientNotFound(input.patientId))
    if (!patient.guardianId) return left(new PatientWithoutGuardian(patient.id))

    if (await this.consents.findActive(patient.id, patient.guardianId))
      return left(new ConsentAlreadyActive(patient.id))

    const result = GuardianConsent.create({
      ...input,
      guardianId: patient.guardianId,
      acceptedAt: input.acceptedAt ?? new Date(),
    })
    if (result.isLeft()) return left(result.value)

    await this.consents.create(result.value)

    return right(result.value)
  }
}
