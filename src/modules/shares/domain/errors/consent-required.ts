import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class ConsentRequired extends DomainError {
  readonly code = 'CONSENT_REQUIRED'
  readonly type = 'invalid'

  constructor(patientId: string) {
    super(
      `Patient ${patientId} has no active consent from the current guardian`,
    )
  }
}
