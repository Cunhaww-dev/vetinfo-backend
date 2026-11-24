import type {
  Attachment as AttachmentRow,
  PrismaClient,
} from '../../../generated/prisma/client.ts'
import { Attachment } from '../domain/attachment-entity.ts'
import type {
  AttachmentRepository,
  AttachmentType,
} from '../domain/attachment-repository.ts'
import {
  LIVE,
  LIVE_IN_VISIT,
  LIVE_VISIT,
} from '../../../shared/prisma/not-deleted.ts'

export class PrismaAttachmentRepository implements AttachmentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(attachment: Attachment): Promise<void> {
    await this.prisma.attachment.create({
      data: {
        id: attachment.id,
        userId: attachment.userId,
        visitId: attachment.visitId,
        typeId: attachment.typeId,
        fileName: attachment.fileName,
        contentType: attachment.contentType,
        sizeBytes: attachment.sizeBytes,
        storageKey: attachment.storageKey,
        description: attachment.description,
        createdAt: attachment.createdAt,
      },
    })
  }

  async findById(id: string, userId: string): Promise<Attachment | null> {
    const row = await this.prisma.attachment.findFirst({
      where: { id, userId, ...LIVE_IN_VISIT },
    })
    return row ? this.toDomain(row) : null
  }

  async listByVisit(visitId: string, userId: string): Promise<Attachment[]> {
    const rows = await this.prisma.attachment.findMany({
      where: { visitId, userId, ...LIVE_IN_VISIT },
      orderBy: { createdAt: 'desc' },
    })
    return rows.map((row) => this.toDomain(row))
  }

  // Paciente -> Atendimento -> Anexo. O anexo não tem patientId
  async listByPatient(
    patientId: string,
    userId: string,
  ): Promise<Attachment[]> {
    const rows = await this.prisma.attachment.findMany({
      where: { userId, deletedAt: null, visit: { patientId, ...LIVE_VISIT } },
      orderBy: { createdAt: 'desc' },
    })
    return rows.map((row) => this.toDomain(row))
  }

  async visitExists(visitId: string, userId: string): Promise<boolean> {
    const count = await this.prisma.visit.count({
      where: { id: visitId, userId, ...LIVE_VISIT },
    })
    return count > 0
  }

  // Soft delete: marca a data. O arquivo fica no storage (prontuário).
  // false = não existe, é de outro usuário ou já foi apagado
  async softDelete(id: string, userId: string): Promise<boolean> {
    const { count } = await this.prisma.attachment.updateMany({
      where: { id, userId, ...LIVE_IN_VISIT },
      data: { deletedAt: new Date() },
    })
    return count > 0
  }

  async patientExists(patientId: string, userId: string): Promise<boolean> {
    const count = await this.prisma.patient.count({
      where: { id: patientId, userId, ...LIVE },
    })
    return count > 0
  }

  async listTypes(): Promise<AttachmentType[]> {
    return this.prisma.attachmentType.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })
  }

  async typeExists(typeId: string): Promise<boolean> {
    const count = await this.prisma.attachmentType.count({
      where: { id: typeId },
    })
    return count > 0
  }

  private toDomain(row: AttachmentRow): Attachment {
    return Attachment.restore({
      id: row.id,
      userId: row.userId,
      visitId: row.visitId,
      typeId: row.typeId,
      fileName: row.fileName,
      contentType: row.contentType,
      sizeBytes: row.sizeBytes,
      storageKey: row.storageKey,
      description: row.description,
      createdAt: row.createdAt,
    })
  }
}
