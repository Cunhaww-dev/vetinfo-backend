import type {
  Medication as MedicationRow,
  PrismaClient,
} from '../../../generated/prisma/client.ts'
import { Medication } from '../domain/medication-entity.ts'
import type {
  MedicationRepository,
  MedicationVisit,
} from '../domain/medication-repository.ts'

// A mais nova primeiro. Com o mesmo início, ganha a última cadastrada
const NEWEST_FIRST = [
  { startDate: 'desc' as const },
  { createdAt: 'desc' as const },
]

export class PrismaMedicationRepository implements MedicationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(medication: Medication): Promise<void> {
    await this.prisma.medication.create({
      data: {
        ...this.toRow(medication),
        id: medication.id,
        userId: medication.userId,
        visitId: medication.visitId,
        createdAt: medication.createdAt,
      },
    })
  }

  async update(medication: Medication): Promise<void> {
    await this.prisma.medication.update({
      where: { id: medication.id },
      data: this.toRow(medication),
    })
  }

  async findById(id: string, userId: string): Promise<Medication | null> {
    const row = await this.prisma.medication.findFirst({
      where: { id, userId },
    })
    return row ? this.toDomain(row) : null
  }

  async listByVisit(visitId: string, userId: string): Promise<Medication[]> {
    const rows = await this.prisma.medication.findMany({
      where: { visitId, userId },
      orderBy: NEWEST_FIRST,
    })
    return rows.map((row) => this.toDomain(row))
  }

  // Paciente -> Atendimento -> Medicação. A medicação não tem patientId
  async listByPatient(
    patientId: string,
    userId: string,
  ): Promise<Medication[]> {
    const rows = await this.prisma.medication.findMany({
      where: { userId, visit: { patientId } },
      orderBy: NEWEST_FIRST,
    })
    return rows.map((row) => this.toDomain(row))
  }

  async findVisit(
    visitId: string,
    userId: string,
  ): Promise<MedicationVisit | null> {
    return this.prisma.visit.findFirst({
      where: { id: visitId, userId },
      select: { id: true, visitedAt: true },
    })
  }

  async patientExists(patientId: string, userId: string): Promise<boolean> {
    const count = await this.prisma.patient.count({
      where: { id: patientId, userId },
    })
    return count > 0
  }

  // Os campos que o usuário pode mudar. O dono e o atendimento nunca mudam.
  private toRow(medication: Medication) {
    return {
      name: medication.name,
      dosage: medication.dosage,
      frequency: medication.frequency,
      route: medication.route,
      startDate: medication.startDate,
      endDate: medication.endDate,
      continuousUse: medication.continuousUse,
      notes: medication.notes,
    }
  }

  private toDomain(row: MedicationRow): Medication {
    return Medication.restore({
      id: row.id,
      userId: row.userId,
      visitId: row.visitId,
      name: row.name,
      dosage: row.dosage,
      frequency: row.frequency,
      route: row.route,
      startDate: row.startDate,
      endDate: row.endDate,
      continuousUse: row.continuousUse,
      notes: row.notes,
      createdAt: row.createdAt,
    })
  }
}
