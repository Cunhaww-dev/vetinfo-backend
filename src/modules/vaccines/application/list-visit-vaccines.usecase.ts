import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { VisitNotFound } from '../../visits/domain/errors/visit-not-found.ts'
import type { Vaccine } from '../domain/vaccine-entity.ts'
import type { VaccineRepository } from '../domain/vaccine-repository.ts'

type ListVisitVaccinesInput = {
  userId: string
  visitId: string
}

export class ListVisitVaccines {
  constructor(private readonly vaccines: VaccineRepository) {}

  async execute(
    input: ListVisitVaccinesInput,
  ): Promise<Either<DomainError, Vaccine[]>> {
    if (!(await this.vaccines.findVisit(input.visitId, input.userId)))
      return left(new VisitNotFound(input.visitId))

    return right(await this.vaccines.listByVisit(input.visitId, input.userId))
  }
}
