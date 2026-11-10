import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class InvalidBirthDate extends DomainError {
  readonly code = 'INVALID_BIRTH_DATE'
  readonly type = 'invalid'

  constructor() {
    super('Birth date cannot be in the future')
  }
}
