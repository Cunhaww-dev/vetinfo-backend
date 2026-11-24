import type {
  PrismaClient,
  Vaccine as VaccineRow,
} from '../../../generated/prisma/client.ts'
import { Vaccine } from '../domain/vaccine-entity.ts'
import type {
  DueVaccine,
  VaccinePatient,
  VaccineRepository,
  VaccineVisit,
} from '../domain/vaccine-repository.ts'
import {
  LIVE,
  LIVE_IN_VISIT,
  LIVE_VISIT,
  LIVE_VACCINE,
} from '../../../shared/prisma/not-deleted.ts'

// A mais nova primeiro. Com a mesma data, ganha a última cadastrada
const NEWEST_FIRST = [
  { appliedAt: 'desc' as const },
  { createdAt: 'desc' as const },
]

const sameVaccine = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase()

export class PrismaVaccineRepository implements VaccineRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(vaccine: Vaccine): Promise<void> {
    await this.prisma.vaccine.create({
      data: {
        ...this.toRow(vaccine),
        id: vaccine.id,
        userId: vaccine.userId,
        patientId: vaccine.patientId,
        visitId: vaccine.visitId,
        createdAt: vaccine.createdAt,
      },
    })
  }

  async update(vaccine: Vaccine): Promise<void> {
    await this.prisma.vaccine.update({
      where: { id: vaccine.id },
      data: this.toRow(vaccine),
    })
  }

  async findById(id: string, userId: string): Promise<Vaccine | null> {
    const row = await this.prisma.vaccine.findFirst({
      where: { id, userId, ...LIVE_VACCINE },
    })
    return row ? this.toDomain(row) : null
  }

  async listByPatient(patientId: string, userId: string): Promise<Vaccine[]> {
    const rows = await this.prisma.vaccine.findMany({
      where: { patientId, userId, ...LIVE_VACCINE },
      orderBy: NEWEST_FIRST,
    })
    return rows.map((row) => this.toDomain(row))
  }

  async listByVisit(visitId: string, userId: string): Promise<Vaccine[]> {
    const rows = await this.prisma.vaccine.findMany({
      where: { visitId, userId, ...LIVE_IN_VISIT },
      orderBy: NEWEST_FIRST,
    })
    return rows.map((row) => this.toDomain(row))
  }

  // Uma dose só está pendente se o paciente não tomou a mesma vacina depois.
  // Ex.: V10 em jan com próxima dose em fev, e outra V10 em fev = a de jan já foi resolvida.
  async listDue(userId: string, until: Date): Promise<DueVaccine[]> {
    const candidates = await this.prisma.vaccine.findMany({
      where: { userId, nextDoseAt: { not: null, lte: until }, ...LIVE_VACCINE },
      include: { patient: { select: { id: true, name: true } } },
      orderBy: { nextDoseAt: 'asc' },
    })
    if (candidates.length === 0) return []

    const history = await this.prisma.vaccine.findMany({
      where: {
        userId,
        patientId: { in: [...new Set(candidates.map((c) => c.patientId))] },
        ...LIVE_VACCINE,
      },
      select: { id: true, patientId: true, name: true, appliedAt: true },
    })

    return candidates
      .filter(
        (candidate) =>
          !history.some(
            (later) =>
              later.id !== candidate.id &&
              later.patientId === candidate.patientId &&
              sameVaccine(later.name, candidate.name) &&
              later.appliedAt.getTime() > candidate.appliedAt.getTime(),
          ),
      )
      .map((candidate) => ({
        vaccineId: candidate.id,
        name: candidate.name,
        nextDoseAt: candidate.nextDoseAt as Date, // o where garante que não é null
        patient: candidate.patient,
      }))
  }

  // Soft delete: marca a data. false = não existe, é de outro usuário ou já foi apagado
  async softDelete(id: string, userId: string): Promise<boolean> {
    const { count } = await this.prisma.vaccine.updateMany({
      where: { id, userId, ...LIVE_VACCINE },
      data: { deletedAt: new Date() },
    })
    return count > 0
  }

  async findPatient(
    patientId: string,
    userId: string,
  ): Promise<VaccinePatient | null> {
    return this.prisma.patient.findFirst({
      where: { id: patientId, userId, ...LIVE },
      select: { id: true, birthDate: true },
    })
  }

  async findVisit(
    visitId: string,
    userId: string,
  ): Promise<VaccineVisit | null> {
    return this.prisma.visit.findFirst({
      where: { id: visitId, userId, ...LIVE_VISIT },
      select: { id: true, patientId: true, visitedAt: true },
    })
  }

  // Os campos que o usuário pode mudar. O dono, o paciente e o atendimento nunca mudam.
  private toRow(vaccine: Vaccine) {
    return {
      name: vaccine.name,
      appliedAt: vaccine.appliedAt,
      nextDoseAt: vaccine.nextDoseAt,
      manufacturer: vaccine.manufacturer,
      batch: vaccine.batch,
      notes: vaccine.notes,
    }
  }

  private toDomain(row: VaccineRow): Vaccine {
    return Vaccine.restore({
      id: row.id,
      userId: row.userId,
      patientId: row.patientId,
      visitId: row.visitId,
      name: row.name,
      appliedAt: row.appliedAt,
      nextDoseAt: row.nextDoseAt,
      manufacturer: row.manufacturer,
      batch: row.batch,
      notes: row.notes,
      createdAt: row.createdAt,
    })
  }
}
