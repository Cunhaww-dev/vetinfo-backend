import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class InvalidVisitDate extends DomainError {
  readonly code = 'INVALID_VISIT_DATE'
  readonly type = 'invalid'

  constructor() {
    super('Visit date cannot be in the future')
  }
}
