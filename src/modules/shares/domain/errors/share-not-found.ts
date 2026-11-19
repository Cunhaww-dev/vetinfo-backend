import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class ShareNotFound extends DomainError {
  readonly code = 'SHARE_NOT_FOUND'
  readonly type = 'not_found'

  constructor(idOrCode: string) {
    super(`Share ${idOrCode} not found`)
  }
}
