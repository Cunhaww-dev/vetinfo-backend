import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class CrmvAlreadyActivated extends DomainError {
  readonly code = 'CRMV_ALREADY_ACTIVATED'

  constructor() {
    super('CRMV is already activated for this user')
  }
}
