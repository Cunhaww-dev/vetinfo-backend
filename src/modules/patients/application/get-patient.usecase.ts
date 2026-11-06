import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { PatientNotFound } from '../domain/errors/patient-not-found.ts'
import type { Patient } from '../domain/patient-entity.ts'
import type { PatientRepository } from '../domain/patient-repository.ts'

type GetPatientInput = {
  userId: string
  patientId: string
}

export class GetPatient {
  constructor(private readonly patients: PatientRepository) {}

  async execute(input: GetPatientInput): Promise<Either<DomainError, Patient>> {
    const patient = await this.patients.findById(input.patientId, input.userId)
    if (!patient) return left(new PatientNotFound(input.patientId))

    return right(patient)
  }
}
