import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class InvalidAddress extends DomainError {
  readonly code = 'INVALID_ADDRESS'
  readonly type = 'invalid'

  constructor(field: string, value: string) {
    super(`Address ${field} ${value} is invalid`)
  }
}
