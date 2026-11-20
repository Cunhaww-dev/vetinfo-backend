import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { VisitNotFound } from '../domain/errors/visit-not-found.ts'
import type { VisitRepository } from '../domain/visit-repository.ts'

type DeleteVisitInput = {
  userId: string
  visitId: string
}

// Soft delete: o registro some do app, mas fica no banco.
// O prontuário é documento clínico, então nada sai de verdade.
export class DeleteVisit {
  constructor(private readonly visits: VisitRepository) {}

  async execute(input: DeleteVisitInput): Promise<Either<DomainError, null>> {
    const deleted = await this.visits.softDelete(input.visitId, input.userId)
    if (!deleted) return left(new VisitNotFound(input.visitId))

    return right(null)
  }
}
