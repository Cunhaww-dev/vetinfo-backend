import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class SpeciesNotFound extends DomainError {
  readonly code = 'SPECIES_NOT_FOUND'
  readonly type = 'not_found'

  constructor(id: string) {
    super(`Species ${id} not found`)
  }
}
