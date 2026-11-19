import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class ShareNotAvailable extends DomainError {
  readonly code = 'SHARE_NOT_AVAILABLE'
  readonly type = 'gone'

  constructor(reason: string) {
    super(`Share is not available: ${reason}`)
  }
}
