import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class ConsentAlreadyActive extends DomainError {
  readonly code = 'CONSENT_ALREADY_ACTIVE'
  readonly type = 'conflict'

  constructor(patientId: string) {
    super(
      `Patient ${patientId} already has an active consent from this guardian`,
    )
  }
}
