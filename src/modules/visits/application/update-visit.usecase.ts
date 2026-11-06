import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { VisitNotFound } from '../domain/errors/visit-not-found.ts'
import type {
  Visit,
  UpdateVisitInput as VisitChanges,
} from '../domain/visit-entity.ts'
import type { VisitRepository } from '../domain/visit-repository.ts'

type UpdateVisitInput = VisitChanges & {
  userId: string
  visitId: string
}

export class UpdateVisit {
  constructor(private readonly visits: VisitRepository) {}

  async execute(input: UpdateVisitInput): Promise<Either<DomainError, Visit>> {
    const { userId, visitId, ...changes } = input

    const visit = await this.visits.findById(visitId, userId)
    if (!visit) return left(new VisitNotFound(visitId))

    const result = visit.update(changes)
    if (result.isLeft()) return left(result.value)

    await this.visits.update(result.value)

    return right(result.value)
  }
}
