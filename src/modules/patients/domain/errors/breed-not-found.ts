import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class BreedNotFound extends DomainError {
  readonly code = 'BREED_NOT_FOUND'
  readonly type = 'not_found'

  constructor(id: string) {
    super(`Breed ${id} not found`)
  }
}
