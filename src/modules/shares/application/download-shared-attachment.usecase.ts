import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import type { FileStorage } from '../../../shared/storage/file-storage.ts'
import { AttachmentNotFound } from '../../attachments/domain/errors/attachment-not-found.ts'
import { ShareNotAvailable } from '../domain/errors/share-not-available.ts'
import { ShareNotFound } from '../domain/errors/share-not-found.ts'
import { normalizeShareCode } from '../domain/share-code.ts'
import type { ShareRepository } from '../domain/share-repository.ts'
import type { SharedRecordReader } from '../domain/shared-record-reader.ts'
import { visiblePatientIds } from './access-share.usecase.ts'

type DownloadSharedAttachmentInput = { code: string; attachmentId: string }

type Download = { fileName: string; contentType: string; content: Buffer }

// Baixar um anexo não conta um uso: ele abre a partir da página do código
export class DownloadSharedAttachment {
  constructor(
    private readonly shares: ShareRepository,
    private readonly reader: SharedRecordReader,
    private readonly storage: FileStorage,
  ) {}

  async execute(
    input: DownloadSharedAttachmentInput,
  ): Promise<Either<DomainError, Download>> {
    const code = normalizeShareCode(input.code)
    const share = await this.shares.findByCode(code)
    if (!share) return left(new ShareNotFound(code))
    if (!share.canServeFiles())
      return left(new ShareNotAvailable(`it is ${share.status()}`))

    const patientIds = await visiblePatientIds(share, this.shares)
    const attachment = await this.reader.findAttachment(
      input.attachmentId,
      patientIds,
      share.userId,
    )
    if (!attachment) return left(new AttachmentNotFound(input.attachmentId))

    const content = await this.storage.read(attachment.storageKey)

    return right({
      fileName: attachment.fileName,
      contentType: attachment.contentType,
      content,
    })
  }
}
