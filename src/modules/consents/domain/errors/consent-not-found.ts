import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class ConsentNotFound extends DomainError {
  readonly code = 'CONSENT_NOT_FOUND'
  readonly type = 'not_found'

  constructor(id: string) {
    super(`Consent ${id} not found`)
  }
}
