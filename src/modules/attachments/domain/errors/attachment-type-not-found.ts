import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class AttachmentTypeNotFound extends DomainError {
  readonly code = 'ATTACHMENT_TYPE_NOT_FOUND'
  readonly type = 'not_found'

  constructor(id: string) {
    super(`Attachment type ${id} not found`)
  }
}
