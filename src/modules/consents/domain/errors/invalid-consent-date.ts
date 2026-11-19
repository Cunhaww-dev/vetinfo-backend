import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class InvalidConsentDate extends DomainError {
  readonly code = 'INVALID_CONSENT_DATE'
  readonly type = 'invalid'

  constructor() {
    super('Consent date cannot be in the future')
  }
}
