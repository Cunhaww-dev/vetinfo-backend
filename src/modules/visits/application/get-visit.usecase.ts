import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { VisitNotFound } from '../domain/errors/visit-not-found.ts'
import type { Visit } from '../domain/visit-entity.ts'
import type { VisitRepository } from '../domain/visit-repository.ts'

type GetVisitInput = {
  userId: string
  visitId: string
}

export class GetVisit {
  constructor(private readonly visits: VisitRepository) {}

  async execute(input: GetVisitInput): Promise<Either<DomainError, Visit>> {
    const visit = await this.visits.findById(input.visitId, input.userId)
    if (!visit) return left(new VisitNotFound(input.visitId))

    return right(visit)
  }
}
