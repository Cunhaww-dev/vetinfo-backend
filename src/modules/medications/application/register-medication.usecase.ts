import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { VisitNotFound } from '../../visits/domain/errors/visit-not-found.ts'
import {
  Medication,
  type MedicationRoute,
} from '../domain/medication-entity.ts'
import type { MedicationRepository } from '../domain/medication-repository.ts'

type RegisterMedicationInput = {
  userId: string
  visitId: string
  name: string
  dosage: string
  frequency: string
  route: MedicationRoute
  startDate?: Date | undefined
  endDate?: Date | null | undefined
  continuousUse?: boolean | undefined
  notes?: string | null | undefined
}

export class RegisterMedication {
  constructor(private readonly medications: MedicationRepository) {}

  async execute(
    input: RegisterMedicationInput,
  ): Promise<Either<DomainError, Medication>> {
    const visit = await this.medications.findVisit(input.visitId, input.userId)
    if (!visit) return left(new VisitNotFound(input.visitId))

    // Sem data de início, a medicação começa no dia do atendimento
    const startDate =
      input.startDate ?? new Date(visit.visitedAt.toISOString().slice(0, 10))

    const result = Medication.create({ ...input, startDate })
    if (result.isLeft()) return left(result.value)

    await this.medications.create(result.value)

    return right(result.value)
  }
}
