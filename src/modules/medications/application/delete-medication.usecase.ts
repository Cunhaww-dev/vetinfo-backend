import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { MedicationNotFound } from '../domain/errors/medication-not-found.ts'
import type { MedicationRepository } from '../domain/medication-repository.ts'

type DeleteMedicationInput = {
  userId: string
  medicationId: string
}

// Soft delete: o registro some do app, mas fica no banco.
// O prontuário é documento clínico, então nada sai de verdade.
export class DeleteMedication {
  constructor(private readonly medications: MedicationRepository) {}

  async execute(
    input: DeleteMedicationInput,
  ): Promise<Either<DomainError, null>> {
    const deleted = await this.medications.softDelete(
      input.medicationId,
      input.userId,
    )
    if (!deleted) return left(new MedicationNotFound(input.medicationId))

    return right(null)
  }
}
