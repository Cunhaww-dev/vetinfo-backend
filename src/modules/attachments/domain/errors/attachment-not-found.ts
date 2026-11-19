import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class AttachmentNotFound extends DomainError {
  readonly code = 'ATTACHMENT_NOT_FOUND'
  readonly type = 'not_found'

  constructor(id: string) {
    super(`Attachment ${id} not found`)
  }
}
