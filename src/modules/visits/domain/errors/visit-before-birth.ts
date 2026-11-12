import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class VisitBeforeBirth extends DomainError {
  readonly code = 'VISIT_BEFORE_BIRTH'
  readonly type = 'invalid'

  constructor() {
    super('Visit date is before the patient birth date')
  }
}
