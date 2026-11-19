import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import type { FileStorage } from '../../../shared/storage/file-storage.ts'
import type { Attachment } from '../domain/attachment-entity.ts'
import type { AttachmentRepository } from '../domain/attachment-repository.ts'
import { AttachmentNotFound } from '../domain/errors/attachment-not-found.ts'

type DownloadAttachmentInput = {
  userId: string
  attachmentId: string
}

type Download = { attachment: Attachment; content: Buffer }

// O arquivo só sai depois de conferir o dono. O storage nunca fica público.
export class DownloadAttachment {
  constructor(
    private readonly attachments: AttachmentRepository,
    private readonly storage: FileStorage,
  ) {}

  async execute(
    input: DownloadAttachmentInput,
  ): Promise<Either<DomainError, Download>> {
    const attachment = await this.attachments.findById(
      input.attachmentId,
      input.userId,
    )
    if (!attachment) return left(new AttachmentNotFound(input.attachmentId))

    const content = await this.storage.read(attachment.storageKey)

    return right({ attachment, content })
  }
}
