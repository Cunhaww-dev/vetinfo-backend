import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class ShareAlreadyRevoked extends DomainError {
  readonly code = 'SHARE_ALREADY_REVOKED'
  readonly type = 'conflict'

  constructor(id: string) {
    super(`Share ${id} is already revoked`)
  }
}
