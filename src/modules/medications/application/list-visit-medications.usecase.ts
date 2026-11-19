import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { VisitNotFound } from '../../visits/domain/errors/visit-not-found.ts'
import type { Medication } from '../domain/medication-entity.ts'
import type { MedicationRepository } from '../domain/medication-repository.ts'

type ListVisitMedicationsInput = {
  userId: string
  visitId: string
}

export class ListVisitMedications {
  constructor(private readonly medications: MedicationRepository) {}

  async execute(
    input: ListVisitMedicationsInput,
  ): Promise<Either<DomainError, Medication[]>> {
    // Atendimento de outro usuário = 404, e não uma lista vazia
    if (!(await this.medications.findVisit(input.visitId, input.userId)))
      return left(new VisitNotFound(input.visitId))

    return right(
      await this.medications.listByVisit(input.visitId, input.userId),
    )
  }
}
