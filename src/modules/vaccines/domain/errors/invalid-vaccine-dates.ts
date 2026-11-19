import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class InvalidVaccineDates extends DomainError {
  readonly code = 'INVALID_VACCINE_DATES'
  readonly type = 'invalid'

  constructor(reason: string) {
    super(`Invalid vaccine dates: ${reason}`)
  }
}
