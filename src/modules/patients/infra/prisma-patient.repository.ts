import type {
  Patient as PatientRow,
  PrismaClient,
  BodyConditionScale as ScaleRow,
} from '../../../generated/prisma/client.ts'
import { scaleFromRow } from '../../../shared/prisma/body-condition-scale.ts'
import { Patient, type PatientBreed } from '../domain/patient-entity.ts'
import type { PatientRepository } from '../domain/patient-repository.ts'

// O paciente sempre vem com a raça e a espécie (com a escala do escore)
const BREED_FIELDS = {
  id: true,
  name: true,
  species: { select: { id: true, name: true, bodyConditionScale: true } },
}

type BreedRow = {
  id: string
  name: string
  species: { id: string; name: string; bodyConditionScale: ScaleRow }
}

const toBreed = (row: BreedRow): PatientBreed => ({
  ...row,
  species: {
    ...row.species,
    bodyConditionScale: scaleFromRow(row.species.bodyConditionScale),
  },
})
const WITH_BREED = { breed: { select: BREED_FIELDS } }

export class PrismaPatientRepository implements PatientRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(patient: Patient): Promise<void> {
    await this.prisma.patient.create({
      data: {
        ...this.toRow(patient),
        id: patient.id,
        userId: patient.userId,
        createdAt: patient.createdAt, // a mesma data que a resposta mostra
      },
    })
  }

  async update(patient: Patient): Promise<void> {
    await this.prisma.patient.update({
      where: { id: patient.id },
      data: this.toRow(patient),
    })
  }

  async findById(id: string, userId: string): Promise<Patient | null> {
    const row = await this.prisma.patient.findFirst({
      where: { id, userId },
      include: WITH_BREED,
    })
    return row ? this.toDomain(row) : null
  }

  async listByUser(
    userId: string,
    filters: { guardianId?: string | undefined },
  ): Promise<Patient[]> {
    const rows = await this.prisma.patient.findMany({
      where: {
        userId,
        ...(filters.guardianId && { guardianId: filters.guardianId }),
      },
      include: WITH_BREED,
      orderBy: { name: 'asc' },
    })
    return rows.map((row) => this.toDomain(row))
  }

  async findBreed(breedId: string): Promise<PatientBreed | null> {
    const row = await this.prisma.breed.findUnique({
      where: { id: breedId },
      select: BREED_FIELDS,
    })
    return row ? toBreed(row) : null
  }

  async guardianExists(guardianId: string, userId: string): Promise<boolean> {
    const count = await this.prisma.guardian.count({
      where: { id: guardianId, userId },
    })
    return count > 0
  }

  async microchipInUse(
    microchip: string,
    userId: string,
    exceptId?: string,
  ): Promise<boolean> {
    const count = await this.prisma.patient.count({
      where: { microchip, userId, ...(exceptId && { NOT: { id: exceptId } }) },
    })
    return count > 0
  }

  // Os campos que o usuário pode mudar. O id, o dono e o createdAt nunca mudam.
  private toRow(patient: Patient) {
    return {
      guardianId: patient.guardianId,
      breedId: patient.breed.id,
      name: patient.name,
      sex: patient.sex,
      neutered: patient.neutered,
      coatColor: patient.coatColor,
      birthDate: patient.birthDate,
      microchip: patient.microchip,
      photoKey: patient.photoKey,
    }
  }

  private toDomain(row: PatientRow & { breed: BreedRow }): Patient {
    return Patient.restore({
      id: row.id,
      userId: row.userId,
      guardianId: row.guardianId,
      breed: toBreed(row.breed),
      name: row.name,
      sex: row.sex,
      neutered: row.neutered,
      coatColor: row.coatColor,
      birthDate: row.birthDate,
      microchip: row.microchip,
      createdAt: row.createdAt,
      photoKey: row.photoKey,
    })
  }
}
