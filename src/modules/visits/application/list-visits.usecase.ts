import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { PatientNotFound } from '../../patients/domain/errors/patient-not-found.ts'
import type { Visit } from '../domain/visit-entity.ts'
import type { VisitRepository } from '../domain/visit-repository.ts'

type ListVisitsInput = {
  userId: string
  patientId: string
}

export class ListVisits {
  constructor(private readonly visits: VisitRepository) {}

  async execute(input: ListVisitsInput): Promise<Either<DomainError, Visit[]>> {
    // Paciente de outro usuário = 404, e não uma lista vazia
    if (!(await this.visits.patientExists(input.patientId, input.userId)))
      return left(new PatientNotFound(input.patientId))

    return right(await this.visits.listByPatient(input.patientId, input.userId))
  }
}
