import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class InvalidShareGuardian extends DomainError {
  readonly code = 'INVALID_SHARE_GUARDIAN'
  readonly type = 'invalid'

  constructor() {
    super(
      'A guardian share needs a guardianId, and a third party share cannot have one',
    )
  }
}
