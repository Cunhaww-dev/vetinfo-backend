import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { PatientNotFound } from '../../patients/domain/errors/patient-not-found.ts'
import type { Medication } from '../domain/medication-entity.ts'
import type { MedicationRepository } from '../domain/medication-repository.ts'

type ListPatientMedicationsInput = {
  userId: string
  patientId: string
  onlyActive?: boolean | undefined
}

// O histórico medicamentoso do paciente: todas as medicações de todos os atendimentos dele
export class ListPatientMedications {
  constructor(private readonly medications: MedicationRepository) {}

  async execute(
    input: ListPatientMedicationsInput,
  ): Promise<Either<DomainError, Medication[]>> {
    if (!(await this.medications.patientExists(input.patientId, input.userId)))
      return left(new PatientNotFound(input.patientId))

    const all = await this.medications.listByPatient(
      input.patientId,
      input.userId,
    )

    return right(input.onlyActive ? all.filter((m) => m.active) : all)
  }
}
