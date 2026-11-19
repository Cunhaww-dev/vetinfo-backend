import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import type { FileStorage } from '../../../shared/storage/file-storage.ts'
import { detectFileType } from '../../../shared/storage/file-type.ts'
import { VisitNotFound } from '../../visits/domain/errors/visit-not-found.ts'
import { Attachment } from '../domain/attachment-entity.ts'
import type { AttachmentRepository } from '../domain/attachment-repository.ts'
import { AttachmentTypeNotFound } from '../domain/errors/attachment-type-not-found.ts'
import { UnsupportedFileType } from '../domain/errors/unsupported-file-type.ts'

type UploadAttachmentInput = {
  userId: string
  visitId: string
  typeId: string
  description?: string | null | undefined
  file: { name: string; content: Buffer }
}

export class UploadAttachment {
  constructor(
    private readonly attachments: AttachmentRepository,
    private readonly storage: FileStorage,
  ) {}

  async execute(
    input: UploadAttachmentInput,
  ): Promise<Either<DomainError, Attachment>> {
    if (!(await this.attachments.visitExists(input.visitId, input.userId)))
      return left(new VisitNotFound(input.visitId))

    if (!(await this.attachments.typeExists(input.typeId)))
      return left(new AttachmentTypeNotFound(input.typeId))

    const contentType = detectFileType(input.file.content)
    if (!contentType) return left(new UnsupportedFileType())

    const attachment = Attachment.create({
      ...input,
      fileName: input.file.name,
      contentType,
      sizeBytes: input.file.content.length,
    })

    // Primeiro o arquivo, depois o banco. Se o banco falhar, sobra um arquivo
    // sem dono no storage, mas nunca um anexo no banco sem arquivo.
    await this.storage.save(
      attachment.storageKey,
      input.file.content,
      contentType,
    )
    await this.attachments.create(attachment)

    return right(attachment)
  }
}
