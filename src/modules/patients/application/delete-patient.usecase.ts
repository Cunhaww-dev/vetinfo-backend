import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { PatientNotFound } from '../domain/errors/patient-not-found.ts'
import type { PatientRepository } from '../domain/patient-repository.ts'

type DeletePatientInput = {
  userId: string
  patientId: string
}

// Soft delete: o paciente some do app com os atendimentos, vacinas, medicações
// e anexos dele. Tudo fica no banco, porque o prontuário é documento clínico.
// Os códigos ativos que mostram o paciente são revogados junto.
export class DeletePatient {
  constructor(private readonly patients: PatientRepository) {}

  async execute(input: DeletePatientInput): Promise<Either<DomainError, null>> {
    const deleted = await this.patients.softDelete(
      input.patientId,
      input.userId,
    )
    if (!deleted) return left(new PatientNotFound(input.patientId))

    return right(null)
  }
}
