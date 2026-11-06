import type {
  PrismaClient,
  Visit as VisitRow,
  VisitSoap as SoapRow,
} from '../../../generated/prisma/client.ts'
import { Soap } from '../domain/soap.ts'
import { Visit } from '../domain/visit-entity.ts'
import type { VisitRepository } from '../domain/visit-repository.ts'
import { VitalSigns } from '../domain/vital-signs.ts'

// O atendimento sempre vem junto com o SOAP dele
const WITH_SOAP = { soap: true }

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
      where: { id, userId },
      include: WITH_SOAP,
    })
    return row ? this.toDomain(row) : null
  }

  async listByPatient(patientId: string, userId: string): Promise<Visit[]> {
    const rows = await this.prisma.visit.findMany({
      where: { patientId, userId },
      include: WITH_SOAP,
      orderBy: { visitedAt: 'desc' },
    })
    return rows.map((row) => this.toDomain(row))
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
        OR: [
          { weightKg: { not: null } },
          { temperatureC: { not: null } },
          { heartRate: { not: null } },
          { respiratoryRate: { not: null } },
        ],
      },
      include: WITH_SOAP,
      orderBy: { visitedAt: 'desc' },
    })
    return row ? this.toDomain(row) : null
  }

  async patientExists(patientId: string, userId: string): Promise<boolean> {
    const count = await this.prisma.patient.count({
      where: { id: patientId, userId },
    })
    return count > 0
  }

  // Os campos que o usuário pode mudar. O autor, o paciente e o snapshot nunca mudam.
  private toRow(visit: Visit) {
    return {
      visitedAt: visit.visitedAt,
      weightKg: visit.vitalSigns.weightKg,
      temperatureC: visit.vitalSigns.temperatureC,
      heartRate: visit.vitalSigns.heartRate,
      respiratoryRate: visit.vitalSigns.respiratoryRate,
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
      }),
      // O create sempre grava o SOAP. O Soap.create() só cobre uma linha criada fora da API.
      soap: row.soap ? Soap.restore(row.soap) : Soap.create(),
      createdAt: row.createdAt,
    })
  }
}
