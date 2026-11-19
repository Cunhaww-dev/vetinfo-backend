import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { VisitNotFound } from '../../visits/domain/errors/visit-not-found.ts'
import type { Attachment } from '../domain/attachment-entity.ts'
import type { AttachmentRepository } from '../domain/attachment-repository.ts'

type ListVisitAttachmentsInput = {
  userId: string
  visitId: string
}

export class ListVisitAttachments {
  constructor(private readonly attachments: AttachmentRepository) {}

  async execute(
    input: ListVisitAttachmentsInput,
  ): Promise<Either<DomainError, Attachment[]>> {
    if (!(await this.attachments.visitExists(input.visitId, input.userId)))
      return left(new VisitNotFound(input.visitId))

    return right(
      await this.attachments.listByVisit(input.visitId, input.userId),
    )
  }
}
