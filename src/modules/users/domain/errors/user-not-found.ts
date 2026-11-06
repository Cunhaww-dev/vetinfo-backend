import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class UserNotFound extends DomainError {
  readonly code = 'USER_NOT_FOUND'
  readonly type = 'not_found'

  constructor(id: string) {
    super(`User ${id} not found`)
  }
}
