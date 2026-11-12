import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class InvalidPhone extends DomainError {
  readonly code = 'INVALID_PHONE'
  readonly type = 'invalid'

  constructor(phone: string) {
    super(`Phone ${phone} is invalid`)
  }
}
