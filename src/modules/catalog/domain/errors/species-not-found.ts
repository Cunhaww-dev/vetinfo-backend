import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class SpeciesNotFound extends DomainError {
  readonly code = 'SPECIES_NOT_FOUND'

  constructor(id: string) {
    super(`Specie ${id} not found`)
  }
}
