import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { VisitNotFound } from '../domain/errors/visit-not-found.ts'
import type { Visit } from '../domain/visit-entity.ts'
import type { VisitRepository } from '../domain/visit-repository.ts'

type FinishVisitInput = {
  userId: string
  visitId: string
}

// O vet terminou o atendimento. Finalizar 2 vezes não é erro: o botão
// pode ser tocado de novo, e a data continua a da primeira vez.
export class FinishVisit {
  constructor(private readonly visits: VisitRepository) {}

  async execute(input: FinishVisitInput): Promise<Either<DomainError, Visit>> {
    const visit = await this.visits.findById(input.visitId, input.userId)
    if (!visit) return left(new VisitNotFound(input.visitId))

    const finished = visit.finish()
    if (finished !== visit) await this.visits.update(finished)

    return right(finished)
  }
}
