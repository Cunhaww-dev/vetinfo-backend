import type { Request, Response } from 'express'
import type { AuthLocals } from '../../../shared/http/ensure-authenticated.middleware.ts'
import { sendFile } from '../../../shared/http/send-file.ts'
import type { AccessShare } from '../application/access-share.usecase.ts'
import type { CreateShare } from '../application/create-share.usecase.ts'
import type { DownloadSharedAttachment } from '../application/download-shared-attachment.usecase.ts'
import type { GetShare } from '../application/get-share.usecase.ts'
import type { ListShares } from '../application/list-shares.usecase.ts'
import type { RevokeShare } from '../application/revoke-share.usecase.ts'
import type { Share } from '../domain/share-entity.ts'
import type { SharedPatient } from '../domain/shared-record-reader.ts'

type ShareParams = { shareId: string }
type CodeParams = { code: string }
type SharedAttachmentParams = { code: string; attachmentId: string }

const toDay = (date: Date) => date.toISOString().slice(0, 10)

function toHttp(share: Share) {
  return {
    id: share.id,
    type: share.type,
    guardianId: share.guardianId,
    patientIds: share.patientIds,
    code: share.code,
    recipientName: share.recipientName,
    expiresAt: share.expiresAt.toISOString(),
    maxUses: share.maxUses,
    usesCount: share.usesCount,
    status: share.status(),
    revokedAt: share.revokedAt?.toISOString() ?? null,
    createdAt: share.createdAt.toISOString(),
  }
}

function toPublicPatient(patient: SharedPatient, code: string) {
  return {
    ...patient,
    birthDate: toDay(patient.birthDate),
    visits: patient.visits.map((visit) => ({
      ...visit,
      visitedAt: visit.visitedAt.toISOString(),
      medications: visit.medications.map((m) => ({
        ...m,
        startDate: toDay(m.startDate),
        endDate: m.endDate ? toDay(m.endDate) : null,
      })),
      attachments: visit.attachments.map((a) => ({
        ...a,
        fileUrl: `/public/shares/${code}/attachments/${a.id}`,
      })),
    })),
    vaccines: patient.vaccines.map((v) => ({
      ...v,
      appliedAt: toDay(v.appliedAt),
      nextDoseAt: v.nextDoseAt ? toDay(v.nextDoseAt) : null,
    })),
  }
}

export class ShareController {
  constructor(
    private readonly createShare: CreateShare,
    private readonly listShares: ListShares,
    private readonly getShare: GetShare,
    private readonly revokeShare: RevokeShare,
    private readonly accessShare: AccessShare,
    private readonly downloadSharedAttachment: DownloadSharedAttachment,
  ) {}

  create = async (req: Request, res: Response<unknown, AuthLocals>) => {
    const { expiresAt } = req.body
    const result = await this.createShare.execute({
      ...req.body,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      userId: res.locals.userId,
    })
    if (result.isLeft()) throw result.value

    return res.status(201).json(toHttp(result.value))
  }

  list = async (_req: Request, res: Response<unknown, AuthLocals>) => {
    const shares = await this.listShares.execute({ userId: res.locals.userId })
    return res.status(200).json(shares.map(toHttp))
  }

  show = async (
    req: Request<ShareParams>,
    res: Response<unknown, AuthLocals>,
  ) => {
    const result = await this.getShare.execute({
      userId: res.locals.userId,
      shareId: req.params.shareId,
    })
    if (result.isLeft()) throw result.value

    const { share, uses } = result.value
    return res.status(200).json({
      ...toHttp(share),
      uses: uses.map((use) => ({ ...use, usedAt: use.usedAt.toISOString() })),
    })
  }

  revoke = async (
    req: Request<ShareParams>,
    res: Response<unknown, AuthLocals>,
  ) => {
    const result = await this.revokeShare.execute({
      userId: res.locals.userId,
      shareId: req.params.shareId,
    })
    if (result.isLeft()) throw result.value

    return res.status(200).json(toHttp(result.value))
  }

  // Rota pública, sem sessão
  access = async (req: Request<CodeParams>, res: Response) => {
    const result = await this.accessShare.execute({
      code: req.params.code,
      visitor: {
        ipAddress: req.ip ?? null,
        userAgent: req.get('user-agent')?.slice(0, 500) ?? null,
      },
    })
    if (result.isLeft()) throw result.value

    const { share, patients } = result.value
    res.setHeader('Cache-Control', 'private, no-store')
    return res.status(200).json({
      type: share.type,
      expiresAt: share.expiresAt.toISOString(),
      patients: patients.map((p) => toPublicPatient(p, share.code)),
    })
  }

  // Rota pública, sem sessão
  attachment = async (req: Request<SharedAttachmentParams>, res: Response) => {
    const result = await this.downloadSharedAttachment.execute({
      code: req.params.code,
      attachmentId: req.params.attachmentId,
    })
    if (result.isLeft()) throw result.value

    const { fileName, contentType, content } = result.value
    return sendFile(res, { name: fileName, contentType, content })
  }
}
