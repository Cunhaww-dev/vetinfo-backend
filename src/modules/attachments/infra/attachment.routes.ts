import { Router } from 'express'
import { ensureAuthenticated } from '../../../shared/http/ensure-authenticated.middleware.ts'
import { uploadFile } from '../../../shared/http/upload-file.middleware.ts'
import { validateBody } from '../../../shared/http/validate-body.middleware.ts'
import { prisma } from '../../../shared/prisma/client.ts'
import { fileStorage } from '../../../shared/storage/storage.ts'
import { DownloadAttachment } from '../application/download-attachment.usecase.ts'
import { ListAttachmentTypes } from '../application/list-attachment-types.usecase.ts'
import { ListPatientAttachments } from '../application/list-patient-attachments.usecase.ts'
import { ListVisitAttachments } from '../application/list-visit-attachments.usecase.ts'
import { UploadAttachment } from '../application/upload-attachment.usecase.ts'
import { uploadAttachmentSchema } from '../attachment.schema.ts'
import { AttachmentController } from './attachment.controller.ts'
import { PrismaAttachmentRepository } from './prisma-attachment.repository.ts'
import { DeleteAttachment } from '../application/delete-attachment.usecase.ts'

export const MAX_ATTACHMENT_SIZE_MB = 10

const attachmentRepository = new PrismaAttachmentRepository(prisma)

const controller = new AttachmentController(
  new UploadAttachment(attachmentRepository, fileStorage),
  new ListVisitAttachments(attachmentRepository),
  new ListPatientAttachments(attachmentRepository),
  new DownloadAttachment(attachmentRepository, fileStorage),
  new ListAttachmentTypes(attachmentRepository),
  new DeleteAttachment(attachmentRepository),
)

export const attachmentRouter = Router()

attachmentRouter.get(
  '/attachment-types',
  ensureAuthenticated,
  controller.listTypes,
)
// O login vem antes do upload: sem sessão, o arquivo nem chega a ser lido
attachmentRouter.post(
  '/visits/:visitId/attachments',
  ensureAuthenticated,
  uploadFile(MAX_ATTACHMENT_SIZE_MB),
  validateBody(uploadAttachmentSchema),
  controller.upload,
)
attachmentRouter.get(
  '/visits/:visitId/attachments',
  ensureAuthenticated,
  controller.listByVisit,
)
attachmentRouter.get(
  '/patients/:patientId/attachments',
  ensureAuthenticated,
  controller.listByPatient,
)
attachmentRouter.get(
  '/attachments/:attachmentId/file',
  ensureAuthenticated,
  controller.download,
)
attachmentRouter.delete(
  '/attachments/:attachmentId',
  ensureAuthenticated,
  controller.remove,
)
