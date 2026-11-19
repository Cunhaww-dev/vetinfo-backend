import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { PatientNotFound } from '../../patients/domain/errors/patient-not-found.ts'
import type { Vaccine } from '../domain/vaccine-entity.ts'
import type { VaccineRepository } from '../domain/vaccine-repository.ts'

type ListPatientVaccinesInput = {
  userId: string
  patientId: string
}

// O histórico vacinal do paciente, com e sem atendimento
export class ListPatientVaccines {
  constructor(private readonly vaccines: VaccineRepository) {}

  async execute(
    input: ListPatientVaccinesInput,
  ): Promise<Either<DomainError, Vaccine[]>> {
    if (!(await this.vaccines.findPatient(input.patientId, input.userId)))
      return left(new PatientNotFound(input.patientId))

    return right(
      await this.vaccines.listByPatient(input.patientId, input.userId),
    )
  }
}
