import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { MedicationNotFound } from '../domain/errors/medication-not-found.ts'
import type {
  Medication,
  UpdateMedicationInput as MedicationChanges,
} from '../domain/medication-entity.ts'
import type { MedicationRepository } from '../domain/medication-repository.ts'

type UpdateMedicationInput = MedicationChanges & {
  userId: string
  medicationId: string
}

export class UpdateMedication {
  constructor(private readonly medications: MedicationRepository) {}

  async execute(
    input: UpdateMedicationInput,
  ): Promise<Either<DomainError, Medication>> {
    const { userId, medicationId, ...changes } = input

    const medication = await this.medications.findById(medicationId, userId)
    if (!medication) return left(new MedicationNotFound(medicationId))

    const result = medication.update(changes)
    if (result.isLeft()) return left(result.value)

    await this.medications.update(result.value)

    return right(result.value)
  }
}
