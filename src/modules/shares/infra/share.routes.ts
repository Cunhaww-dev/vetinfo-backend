import { Router } from 'express'
import { ensureAuthenticated } from '../../../shared/http/ensure-authenticated.middleware.ts'
import { validateBody } from '../../../shared/http/validate-body.middleware.ts'
import { prisma } from '../../../shared/prisma/client.ts'
import { fileStorage } from '../../../shared/storage/storage.ts'
import { AccessShare } from '../application/access-share.usecase.ts'
import { CreateShare } from '../application/create-share.usecase.ts'
import { DownloadSharedAttachment } from '../application/download-shared-attachment.usecase.ts'
import { GetShare } from '../application/get-share.usecase.ts'
import { ListShares } from '../application/list-shares.usecase.ts'
import { RevokeShare } from '../application/revoke-share.usecase.ts'
import { createShareSchema } from '../share.schema.ts'
import { PrismaShareRepository } from './prisma-share.repository.ts'
import { PrismaSharedRecordReader } from './prisma-shared-record.reader.ts'
import { ShareController } from './share.controller.ts'

const shareRepository = new PrismaShareRepository(prisma)
const sharedRecordReader = new PrismaSharedRecordReader(prisma)

const controller = new ShareController(
  new CreateShare(shareRepository),
  new ListShares(shareRepository),
  new GetShare(shareRepository),
  new RevokeShare(shareRepository),
  new AccessShare(shareRepository, sharedRecordReader),
  new DownloadSharedAttachment(
    shareRepository,
    sharedRecordReader,
    fileStorage,
  ),
)

export const shareRouter = Router()

// Do veterinário: pedem login
shareRouter.post(
  '/shares',
  ensureAuthenticated,
  validateBody(createShareSchema),
  controller.create,
)
shareRouter.get('/shares', ensureAuthenticated, controller.list)
shareRouter.get('/shares/:shareId', ensureAuthenticated, controller.show)
shareRouter.post(
  '/shares/:shareId/revoke',
  ensureAuthenticated,
  controller.revoke,
)

// Públicas: o código é a chave. Somente leitura
shareRouter.get('/public/shares/:code', controller.access)
shareRouter.get(
  '/public/shares/:code/attachments/:attachmentId',
  controller.attachment,
)
