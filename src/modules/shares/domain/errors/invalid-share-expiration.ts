import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class InvalidShareExpiration extends DomainError {
  readonly code = 'INVALID_SHARE_EXPIRATION'
  readonly type = 'invalid'

  constructor(maxDays: number) {
    super(`The share must expire in the future, in up to ${maxDays} days`)
  }
}
