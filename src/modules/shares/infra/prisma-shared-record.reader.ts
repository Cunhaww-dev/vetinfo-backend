import type { PrismaClient } from '../../../generated/prisma/client.ts'
import type {
  SharedAttachment,
  SharedPatient,
  SharedRecordReader,
} from '../domain/shared-record-reader.ts'

// O prontuário que o código mostra: paciente, atendimentos com SOAP, medicações,
// anexos e vacinas. Nada do tutor (nome, telefone, CPF) sai por aqui.
export class PrismaSharedRecordReader implements SharedRecordReader {
  constructor(private readonly prisma: PrismaClient) {}

  async read(
    patientIds: string[],
    ownerId: string,
    options: { hideMicrochip: boolean },
  ): Promise<SharedPatient[]> {
    const rows = await this.prisma.patient.findMany({
      where: { id: { in: patientIds }, userId: ownerId },
      orderBy: { name: 'asc' },
      include: {
        breed: { include: { species: true } },
        visits: {
          orderBy: [{ visitedAt: 'desc' }, { createdAt: 'desc' }],
          include: {
            soap: true,
            medications: { orderBy: { startDate: 'desc' } },
            attachments: {
              orderBy: { createdAt: 'desc' },
              include: { type: true },
            },
          },
        },
        vaccines: { orderBy: { appliedAt: 'desc' } },
      },
    })

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      sex: row.sex,
      neutered: row.neutered,
      coatColor: row.coatColor,
      birthDate: row.birthDate,
      microchip: options.hideMicrochip ? null : row.microchip,
      breed: row.breed.name,
      species: row.breed.species.name,
      visits: row.visits.map((visit) => ({
        id: visit.id,
        visitedAt: visit.visitedAt,
        authorType: visit.authorType,
        vitalSigns: {
          weightKg: visit.weightKg,
          temperatureC: visit.temperatureC,
          heartRate: visit.heartRate,
          respiratoryRate: visit.respiratoryRate,
          bodyConditionScore: visit.bodyConditionScore,
        },
        soap: {
          subjective: visit.soap?.subjective ?? null,
          objective: visit.soap?.objective ?? null,
          assessment: visit.soap?.assessment ?? null,
          plan: visit.soap?.plan ?? null,
        },
        medications: visit.medications.map((m) => ({
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          route: m.route,
          startDate: m.startDate,
          endDate: m.endDate,
          continuousUse: m.continuousUse,
        })),
        attachments: visit.attachments.map((a) => ({
          id: a.id,
          type: a.type.name,
          fileName: a.fileName,
          contentType: a.contentType,
          sizeBytes: a.sizeBytes,
          description: a.description,
        })),
      })),
      vaccines: row.vaccines.map((v) => ({
        name: v.name,
        appliedAt: v.appliedAt,
        nextDoseAt: v.nextDoseAt,
        manufacturer: v.manufacturer,
        batch: v.batch,
      })),
    }))
  }

  async findAttachment(
    attachmentId: string,
    patientIds: string[],
    ownerId: string,
  ): Promise<SharedAttachment | null> {
    return this.prisma.attachment.findFirst({
      where: {
        id: attachmentId,
        userId: ownerId,
        visit: { patientId: { in: patientIds } },
      },
      select: { fileName: true, contentType: true, storageKey: true },
    })
  }
}
