import type { Request, Response } from 'express'
import type { AuthLocals } from '../../../shared/http/ensure-authenticated.middleware.ts'
import { sendFile } from '../../../shared/http/send-file.ts'
import type { DownloadAttachment } from '../application/download-attachment.usecase.ts'
import type { ListAttachmentTypes } from '../application/list-attachment-types.usecase.ts'
import type { ListPatientAttachments } from '../application/list-patient-attachments.usecase.ts'
import type { ListVisitAttachments } from '../application/list-visit-attachments.usecase.ts'
import type { UploadAttachment } from '../application/upload-attachment.usecase.ts'
import type { Attachment } from '../domain/attachment-entity.ts'
import type { DeleteAttachment } from '../application/delete-attachment.usecase.ts'

type VisitParams = { visitId: string }
type PatientParams = { patientId: string }
type AttachmentParams = { attachmentId: string }

function toHttp(attachment: Attachment) {
  return {
    id: attachment.id,
    visitId: attachment.visitId,
    typeId: attachment.typeId,
    fileName: attachment.fileName,
    contentType: attachment.contentType,
    sizeBytes: attachment.sizeBytes,
    description: attachment.description,
    fileUrl: `/attachments/${attachment.id}/file`,
    createdAt: attachment.createdAt.toISOString(),
  }
}

export class AttachmentController {
  constructor(
    private readonly uploadAttachment: UploadAttachment,
    private readonly listVisitAttachments: ListVisitAttachments,
    private readonly listPatientAttachments: ListPatientAttachments,
    private readonly downloadAttachment: DownloadAttachment,
    private readonly listAttachmentTypes: ListAttachmentTypes,
    private readonly deleteAttachment: DeleteAttachment,
  ) {}

  upload = async (
    req: Request<VisitParams>,
    res: Response<unknown, AuthLocals>,
  ) => {
    // O uploadFile garante o req.file antes de chegar aqui
    const file = req.file as Express.Multer.File

    const result = await this.uploadAttachment.execute({
      ...req.body,
      userId: res.locals.userId,
      visitId: req.params.visitId,
      file: { name: file.originalname, content: file.buffer },
    })
    if (result.isLeft()) throw result.value

    return res.status(201).json(toHttp(result.value))
  }

  listByVisit = async (
    req: Request<VisitParams>,
    res: Response<unknown, AuthLocals>,
  ) => {
    const result = await this.listVisitAttachments.execute({
      userId: res.locals.userId,
      visitId: req.params.visitId,
    })
    if (result.isLeft()) throw result.value

    return res.status(200).json(result.value.map(toHttp))
  }

  listByPatient = async (
    req: Request<PatientParams>,
    res: Response<unknown, AuthLocals>,
  ) => {
    const result = await this.listPatientAttachments.execute({
      userId: res.locals.userId,
      patientId: req.params.patientId,
    })
    if (result.isLeft()) throw result.value

    return res.status(200).json(result.value.map(toHttp))
  }

  download = async (
    req: Request<AttachmentParams>,
    res: Response<unknown, AuthLocals>,
  ) => {
    const result = await this.downloadAttachment.execute({
      userId: res.locals.userId,
      attachmentId: req.params.attachmentId,
    })
    if (result.isLeft()) throw result.value

    const { attachment, content } = result.value
    return sendFile(res, {
      name: attachment.fileName,
      contentType: attachment.contentType,
      content,
    })
  }

  listTypes = async (_req: Request, res: Response) => {
    return res.status(200).json(await this.listAttachmentTypes.execute())
  }

  remove = async (
    req: Request<{ attachmentId: string }>,
    res: Response<unknown, AuthLocals>,
  ) => {
    const result = await this.deleteAttachment.execute({
      userId: res.locals.userId,
      attachmentId: req.params.attachmentId,
    })
    if (result.isLeft()) throw result.value

    return res.status(204).send()
  }
}
