import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class VaccineNotFound extends DomainError {
  readonly code = 'VACCINE_NOT_FOUND'
  readonly type = 'not_found'

  constructor(id: string) {
    super(`Vaccine ${id} not found`)
  }
}
