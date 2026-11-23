import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { AttachmentNotFound } from '../domain/errors/attachment-not-found.ts'
import type { AttachmentRepository } from '../domain/attachment-repository.ts'

type DeleteAttachmentInput = {
  userId: string
  attachmentId: string
}

// Soft delete: o registro some do app, mas fica no banco.
// O prontuário é documento clínico, então nada sai de verdade.
export class DeleteAttachment {
  constructor(private readonly attachments: AttachmentRepository) {}

  async execute(
    input: DeleteAttachmentInput,
  ): Promise<Either<DomainError, null>> {
    const deleted = await this.attachments.softDelete(
      input.attachmentId,
      input.userId,
    )
    if (!deleted) return left(new AttachmentNotFound(input.attachmentId))

    return right(null)
  }
}
