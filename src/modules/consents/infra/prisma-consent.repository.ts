import type {
  GuardianConsent as ConsentRow,
  PrismaClient,
} from '../../../generated/prisma/client.ts'
import { LIVE } from '../../../shared/prisma/not-deleted.ts'
import { GuardianConsent } from '../domain/consent-entity.ts'
import type {
  ConsentPatient,
  ConsentRepository,
} from '../domain/consent-repository.ts'

export class PrismaConsentRepository implements ConsentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(consent: GuardianConsent): Promise<void> {
    await this.prisma.guardianConsent.create({
      data: {
        id: consent.id,
        userId: consent.userId,
        guardianId: consent.guardianId,
        patientId: consent.patientId,
        termVersion: consent.termVersion,
        acceptedAt: consent.acceptedAt,
        revokedAt: consent.revokedAt,
        notes: consent.notes,
        createdAt: consent.createdAt,
      },
    })
  }

  // Só a revogação muda. O resto do consentimento nunca é editado
  async update(consent: GuardianConsent): Promise<void> {
    await this.prisma.guardianConsent.update({
      where: { id: consent.id },
      data: { revokedAt: consent.revokedAt },
    })
  }

  async findById(id: string, userId: string): Promise<GuardianConsent | null> {
    const row = await this.prisma.guardianConsent.findFirst({
      where: { id, userId },
    })
    return row ? this.toDomain(row) : null
  }

  async listByPatient(
    patientId: string,
    userId: string,
  ): Promise<GuardianConsent[]> {
    const rows = await this.prisma.guardianConsent.findMany({
      where: { patientId, userId },
      orderBy: { acceptedAt: 'desc' },
    })
    return rows.map((row) => this.toDomain(row))
  }

  async findActive(
    patientId: string,
    guardianId: string,
  ): Promise<GuardianConsent | null> {
    const row = await this.prisma.guardianConsent.findFirst({
      where: { patientId, guardianId, revokedAt: null },
    })
    return row ? this.toDomain(row) : null
  }

  async findPatient(
    patientId: string,
    userId: string,
  ): Promise<ConsentPatient | null> {
    return this.prisma.patient.findFirst({
      where: { id: patientId, userId, ...LIVE },
      select: { id: true, guardianId: true },
    })
  }

  private toDomain(row: ConsentRow): GuardianConsent {
    return GuardianConsent.restore({
      id: row.id,
      userId: row.userId,
      guardianId: row.guardianId,
      patientId: row.patientId,
      termVersion: row.termVersion,
      acceptedAt: row.acceptedAt,
      revokedAt: row.revokedAt,
      notes: row.notes,
      createdAt: row.createdAt,
    })
  }
}
