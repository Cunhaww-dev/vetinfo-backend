import type { PrismaClient } from '../../../generated/prisma/client.ts'
import { Share } from '../domain/share-entity.ts'
import type {
  SharePatient,
  ShareRepository,
  ShareUse,
  ShareVisitor,
} from '../domain/share-repository.ts'

// O compartilhamento sempre vem com os pacientes e o número de usos
const WITH_ITEMS_AND_USES = {
  items: { select: { patientId: true } },
  _count: { select: { uses: true } },
} as const

type ShareRow = {
  id: string
  userId: string
  type: 'guardian' | 'third_party'
  guardianId: string | null
  code: string
  recipientName: string | null
  expiresAt: Date
  revokedAt: Date | null
  createdAt: Date
  items: { patientId: string }[]
  _count: { uses: number }
}

export class PrismaShareRepository implements ShareRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // Escrita aninhada: o compartilhamento e os itens numa transação só
  async create(share: Share): Promise<void> {
    await this.prisma.share.create({
      data: {
        id: share.id,
        userId: share.userId,
        type: share.type,
        guardianId: share.guardianId,
        code: share.code,
        recipientName: share.recipientName,
        expiresAt: share.expiresAt,
        createdAt: share.createdAt,
        items: {
          create: share.patientIds.map((patientId) => ({ patientId })),
        },
      },
    })
  }

  // Só a revogação muda. O resto do código nunca é editado
  async update(share: Share): Promise<void> {
    await this.prisma.share.update({
      where: { id: share.id },
      data: { revokedAt: share.revokedAt },
    })
  }

  async findById(id: string, userId: string): Promise<Share | null> {
    const row = await this.prisma.share.findFirst({
      where: { id, userId },
      include: WITH_ITEMS_AND_USES,
    })
    return row ? this.toDomain(row) : null
  }

  async listByUser(userId: string): Promise<Share[]> {
    const rows = await this.prisma.share.findMany({
      where: { userId },
      include: WITH_ITEMS_AND_USES,
      orderBy: { createdAt: 'desc' },
    })
    return rows.map((row) => this.toDomain(row))
  }

  async listUses(shareId: string): Promise<ShareUse[]> {
    return this.prisma.shareUse.findMany({
      where: { shareId },
      select: { usedAt: true, ipAddress: true, userAgent: true },
      orderBy: { usedAt: 'desc' },
    })
  }

  async findByCode(code: string): Promise<Share | null> {
    const row = await this.prisma.share.findUnique({
      where: { code },
      include: WITH_ITEMS_AND_USES,
    })
    return row ? this.toDomain(row) : null
  }

  async codeExists(code: string): Promise<boolean> {
    return (await this.prisma.share.count({ where: { code } })) > 0
  }

  async recordUse(shareId: string, visitor: ShareVisitor): Promise<void> {
    await this.prisma.shareUse.create({ data: { shareId, ...visitor } })
  }

  async findPatients(ids: string[], userId: string): Promise<SharePatient[]> {
    return this.prisma.patient.findMany({
      where: { id: { in: ids }, userId },
      select: { id: true, guardianId: true },
    })
  }

  async guardianExists(guardianId: string, userId: string): Promise<boolean> {
    const count = await this.prisma.guardian.count({
      where: { id: guardianId, userId },
    })
    return count > 0
  }

  // Só vale o consentimento do tutor atual: o par (paciente, tutor) tem que bater
  async withActiveConsent(patients: SharePatient[]): Promise<Set<string>> {
    const pairs = patients.flatMap((p) =>
      p.guardianId ? [{ patientId: p.id, guardianId: p.guardianId }] : [],
    )
    if (pairs.length === 0) return new Set()

    const consents = await this.prisma.guardianConsent.findMany({
      where: { revokedAt: null, OR: pairs },
      select: { patientId: true },
    })
    return new Set(consents.map((c) => c.patientId))
  }

  private toDomain(row: ShareRow): Share {
    return Share.restore({
      id: row.id,
      userId: row.userId,
      type: row.type,
      guardianId: row.guardianId,
      patientIds: row.items.map((item) => item.patientId),
      code: row.code,
      recipientName: row.recipientName,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt,
      usesCount: row._count.uses,
      createdAt: row.createdAt,
    })
  }
}
