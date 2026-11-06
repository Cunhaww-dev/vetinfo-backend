import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class GuardianNotFound extends DomainError {
  readonly code = 'GUARDIAN_NOT_FOUND'
  readonly type = 'not_found'

  constructor(id: string) {
    super(`Guardian ${id} not found`)
  }
}
