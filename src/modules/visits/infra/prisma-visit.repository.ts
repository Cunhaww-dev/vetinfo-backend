import type {
  PrismaClient,
  Visit as VisitRow,
  VisitSoap as SoapRow,
} from '../../../generated/prisma/client.ts'
import { Soap } from '../domain/soap.ts'
import { Visit } from '../domain/visit-entity.ts'
import type {
  RecentPatient,
  VisitPatient,
  VisitRepository,
  VisitSearchFilters,
  VisitSearchResult,
} from '../domain/visit-repository.ts'
import { VitalSigns } from '../domain/vital-signs.ts'
import {
  scaleFromRow,
  scaleToRow,
} from '../../../shared/prisma/body-condition-scale.ts'
import { LIVE, LIVE_VISIT } from '../../../shared/prisma/not-deleted.ts'

// O atendimento sempre vem junto com o SOAP dele
const WITH_SOAP = { soap: true }

// Mais novo primeiro. Com o mesmo visitedAt, ganha o último cadastrado
const NEWEST_FIRST = [
  { visitedAt: 'desc' as const },
  { createdAt: 'desc' as const },
]

export class PrismaVisitRepository implements VisitRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // Escrita aninhada: o Prisma grava o atendimento e o SOAP numa transação só
  async create(visit: Visit): Promise<void> {
    await this.prisma.visit.create({
      data: {
        ...this.toRow(visit),
        id: visit.id,
        userId: visit.userId,
        patientId: visit.patientId,
        authorType: visit.authorType,
        createdAt: visit.createdAt,
        soap: { create: this.toSoapRow(visit.soap) },
      },
    })
  }

  async update(visit: Visit): Promise<void> {
    await this.prisma.visit.update({
      where: { id: visit.id },
      data: {
        ...this.toRow(visit),
        soap: { update: this.toSoapRow(visit.soap) },
      },
    })
  }

  async findById(id: string, userId: string): Promise<Visit | null> {
    const row = await this.prisma.visit.findFirst({
      where: { id, userId, ...LIVE_VISIT },
      include: WITH_SOAP,
    })
    return row ? this.toDomain(row) : null
  }

  async listByPatient(patientId: string, userId: string): Promise<Visit[]> {
    const rows = await this.prisma.visit.findMany({
      where: { patientId, userId, ...LIVE_VISIT },
      include: WITH_SOAP,
      orderBy: NEWEST_FIRST,
    })
    return rows.map((row) => this.toDomain(row))
  }

  // Um item por paciente: o distinct fica com o primeiro atendimento de cada um,
  // e o primeiro é o mais novo por causa do orderBy.
  async listRecentPatients(
    userId: string,
    limit: number,
  ): Promise<RecentPatient[]> {
    const rows = await this.prisma.visit.findMany({
      where: { userId, ...LIVE_VISIT },
      orderBy: NEWEST_FIRST,
      distinct: ['patientId'],
      take: limit,
      select: {
        id: true,
        visitedAt: true,
        patient: {
          select: {
            id: true,
            name: true,
            breedId: true,
            breed: {
              select: { species: { select: { id: true, name: true } } },
            },
          },
        },
      },
    })
    return rows.map((row) => ({
      visitId: row.id,
      visitedAt: row.visitedAt,
      patient: {
        id: row.patient.id,
        name: row.patient.name,
        breedId: row.patient.breedId,
        species: row.patient.breed.species, // para o ícone da espécie na sidebar
      },
    }))
  }

  // A contagem e a página rodam juntas, na mesma transação
  async search(
    userId: string,
    filters: VisitSearchFilters,
  ): Promise<VisitSearchResult> {
    const where = {
      userId,
      ...LIVE_VISIT,
      ...(filters.speciesId && {
        patient: { breed: { speciesId: filters.speciesId } },
      }),
      ...((filters.from || filters.to) && {
        visitedAt: {
          ...(filters.from && { gte: filters.from }),
          ...(filters.to && { lte: filters.to }),
        },
      }),
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.visit.count({ where }),
      this.prisma.visit.findMany({
        where,
        orderBy: NEWEST_FIRST,
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
        select: {
          id: true,
          visitedAt: true,
          authorType: true,
          soap: { select: { assessment: true } },
          patient: {
            select: {
              id: true,
              name: true,
              breed: {
                select: {
                  id: true,
                  name: true,
                  species: { select: { id: true, name: true } },
                },
              },
              guardian: { select: { id: true, name: true } },
            },
          },
        },
      }),
    ])

    return {
      total,
      items: rows.map((row) => ({
        id: row.id,
        visitedAt: row.visitedAt,
        authorType: row.authorType,
        assessment: row.soap?.assessment ?? null,
        patient: {
          id: row.patient.id,
          name: row.patient.name,
          species: row.patient.breed.species,
          breed: { id: row.patient.breed.id, name: row.patient.breed.name },
        },
        guardian: row.patient.guardian,
      })),
    }
  }

  // O último atendimento com pelo menos um sinal vital preenchido
  async findLatestWithVitalSigns(
    patientId: string,
    userId: string,
  ): Promise<Visit | null> {
    const row = await this.prisma.visit.findFirst({
      where: {
        patientId,
        userId,
        ...LIVE_VISIT,
        OR: [
          { weightKg: { not: null } },
          { temperatureC: { not: null } },
          { heartRate: { not: null } },
          { respiratoryRate: { not: null } },
          { bodyConditionScore: { not: null } },
        ],
      },
      include: WITH_SOAP,
      orderBy: NEWEST_FIRST,
    })
    return row ? this.toDomain(row) : null
  }

  // Soft delete: o atendimento some, e com ele as medicações, vacinas e anexos dele
  async softDelete(id: string, userId: string): Promise<boolean> {
    const { count } = await this.prisma.visit.updateMany({
      where: { id, userId, ...LIVE_VISIT },
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
  async findPatient(
    patientId: string,
    userId: string,
  ): Promise<VisitPatient | null> {
    const row = await this.prisma.patient.findFirst({
      where: { id: patientId, userId, ...LIVE },
      select: {
        birthDate: true,
        breed: {
          select: { species: { select: { bodyConditionScale: true } } },
        },
      },
    })
    if (!row) return null
    return {
      birthDate: row.birthDate,
      bodyConditionScale: scaleFromRow(row.breed.species.bodyConditionScale),
    }
  }

  // Os campos que o usuário pode mudar. O autor, o paciente e o snapshot nunca mudam.
  private toRow(visit: Visit) {
    return {
      visitedAt: visit.visitedAt,
      weightKg: visit.vitalSigns.weightKg,
      temperatureC: visit.vitalSigns.temperatureC,
      heartRate: visit.vitalSigns.heartRate,
      respiratoryRate: visit.vitalSigns.respiratoryRate,
      bodyConditionScore: visit.vitalSigns.bodyConditionScore,
      bodyConditionScale: visit.vitalSigns.bodyConditionScale
        ? scaleToRow(visit.vitalSigns.bodyConditionScale)
        : null,
    }
  }

  private toSoapRow(soap: Soap) {
    return {
      subjective: soap.subjective,
      objective: soap.objective,
      assessment: soap.assessment,
      plan: soap.plan,
    }
  }

  private toDomain(row: VisitRow & { soap: SoapRow | null }): Visit {
    return Visit.restore({
      id: row.id,
      userId: row.userId,
      patientId: row.patientId,
      authorType: row.authorType,
      visitedAt: row.visitedAt,
      vitalSigns: VitalSigns.restore({
        weightKg: row.weightKg,
        temperatureC: row.temperatureC,
        heartRate: row.heartRate,
        respiratoryRate: row.respiratoryRate,
        bodyConditionScore: row.bodyConditionScore,
        bodyConditionScale: row.bodyConditionScale
          ? scaleFromRow(row.bodyConditionScale)
          : null,
      }),
      // O create sempre grava o SOAP. O Soap.create() só cobre uma linha criada fora da API.
      soap: row.soap ? Soap.restore(row.soap) : Soap.create(),
      createdAt: row.createdAt,
    })
  }
}
