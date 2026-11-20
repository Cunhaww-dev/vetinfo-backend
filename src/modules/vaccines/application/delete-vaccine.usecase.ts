import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { VaccineNotFound } from '../domain/errors/vaccine-not-found.ts'
import type { VaccineRepository } from '../domain/vaccine-repository.ts'

type DeleteVaccineInput = {
  userId: string
  vaccineId: string
}

// Soft delete: o registro some do app, mas fica no banco.
// O prontuário é documento clínico, então nada sai de verdade.
export class DeleteVaccine {
  constructor(private readonly vaccines: VaccineRepository) {}

  async execute(input: DeleteVaccineInput): Promise<Either<DomainError, null>> {
    const deleted = await this.vaccines.softDelete(
      input.vaccineId,
      input.userId,
    )
    if (!deleted) return left(new VaccineNotFound(input.vaccineId))

    return right(null)
  }
}
