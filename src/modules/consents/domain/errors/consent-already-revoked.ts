import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class ConsentAlreadyRevoked extends DomainError {
  readonly code = 'CONSENT_ALREADY_REVOKED'
  readonly type = 'conflict'

  constructor(id: string) {
    super(`Consent ${id} is already revoked`)
  }
}
