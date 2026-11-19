import type {
  AttachmentRepository,
  AttachmentType,
} from '../domain/attachment-repository.ts'

export class ListAttachmentTypes {
  constructor(private readonly attachments: AttachmentRepository) {}

  async execute(): Promise<AttachmentType[]> {
    return this.attachments.listTypes()
  }
}
