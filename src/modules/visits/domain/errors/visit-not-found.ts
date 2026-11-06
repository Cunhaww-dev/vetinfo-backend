import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class VisitNotFound extends DomainError {
  readonly code = 'VISIT_NOT_FOUND'
  readonly type = 'not_found'

  constructor(id: string) {
    super(`Visit ${id} not found`)
  }
}
