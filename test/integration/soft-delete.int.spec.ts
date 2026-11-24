import { randomUUID } from 'node:crypto'
import { beforeAll, describe, expect, it } from 'vitest'
import { DeleteGuardian } from '../../src/modules/guardians/application/delete-guardian.usecase.ts'
import { PrismaGuardianRepository } from '../../src/modules/guardians/infra/prisma-guardian.repository.ts'
import { DeletePatient } from '../../src/modules/patients/application/delete-patient.usecase.ts'
import { PrismaPatientRepository } from '../../src/modules/patients/infra/prisma-patient.repository.ts'
import { PrismaVaccineRepository } from '../../src/modules/vaccines/infra/prisma-vaccine.repository.ts'
import { PrismaVisitRepository } from '../../src/modules/visits/infra/prisma-visit.repository.ts'
import { prisma } from '../../src/shared/prisma/client.ts'

// Apagar o paciente e o tutor: some tudo o que é deles, os códigos caem,
// e o microchip e o CPF ficam livres para um cadastro novo.

const VET = randomUUID()
const CPF = '52998224725'
const MICROCHIP = '985000000000099'
const ids = {
  guardian: randomUUID(),
  patient: randomUUID(),
  visit: randomUUID(),
  guardianShare: randomUUID(),
  patientShare: randomUUID(),
}
let breedId = ''

const patients = new PrismaPatientRepository(prisma)
const guardians = new PrismaGuardianRepository(prisma)
const visits = new PrismaVisitRepository(prisma)
const vaccines = new PrismaVaccineRepository(prisma)

const share = (id: string, data: { type: 'guardian' | 'third_party' }) =>
  prisma.share.create({
    data: {
      id,
      userId: VET,
      ...data,
      ...(data.type === 'guardian' && { guardianId: ids.guardian }),
      code: randomUUID().slice(0, 10).toUpperCase(),
      expiresAt: new Date(Date.now() + 86_400_000),
      items: { create: { patientId: ids.patient } },
    },
  })

const revokedAt = async (id: string) =>
  (await prisma.share.findUniqueOrThrow({ where: { id } })).revokedAt

beforeAll(async () => {
  if (!process.env.DATABASE_URL?.includes('_test'))
    throw new Error('Integration tests must run on the _test database')

  await prisma.user.create({
    data: {
      id: VET,
      name: 'Vet',
      email: `${VET}@test.com`,
      type: 'professional',
    },
  })
  const species = await prisma.species.upsert({
    where: { name: 'Cão' },
    update: {},
    create: { name: 'Cão' },
  })
  const breed = await prisma.breed.upsert({
    where: { speciesId_name: { speciesId: species.id, name: 'SRD' } },
    update: {},
    create: { name: 'SRD', speciesId: species.id },
  })
  breedId = breed.id

  await prisma.guardian.create({
    data: {
      id: ids.guardian,
      userId: VET,
      name: 'Tutor',
      phone: '21999990000',
      email: 'tutor@test.com',
      cpf: CPF,
      birthDate: new Date('1990-01-01'),
    },
  })
  await prisma.patient.create({
    data: {
      id: ids.patient,
      userId: VET,
      guardianId: ids.guardian,
      breedId,
      name: 'Thor',
      sex: 'male',
      birthDate: new Date('2020-01-01'),
      microchip: MICROCHIP,
    },
  })
  await prisma.visit.create({
    data: {
      id: ids.visit,
      userId: VET,
      patientId: ids.patient,
      authorType: 'professional',
      visitedAt: new Date(),
      soap: { create: {} },
    },
  })
  await prisma.vaccine.create({
    data: {
      userId: VET,
      patientId: ids.patient,
      name: 'V10',
      appliedAt: new Date('2026-01-01'),
      nextDoseAt: new Date(Date.now() + 86_400_000),
    },
  })
  await share(ids.patientShare, { type: 'third_party' })
  await share(ids.guardianShare, { type: 'guardian' })
})

describe('apagar paciente e tutor', () => {
  it('o tutor com paciente não sai', async () => {
    const result = await new DeleteGuardian(guardians).execute({
      userId: VET,
      guardianId: ids.guardian,
    })

    expect(result.isLeft() && result.value.code).toBe('GUARDIAN_HAS_PATIENTS')
    expect(await guardians.findById(ids.guardian, VET)).not.toBeNull()
  })

  it('o paciente some com tudo o que é dele, e os códigos dele caem', async () => {
    const result = await new DeletePatient(patients).execute({
      userId: VET,
      patientId: ids.patient,
    })

    expect(result.isRight()).toBe(true)
    expect(await patients.findById(ids.patient, VET)).toBeNull()
    expect(await visits.findById(ids.visit, VET)).toBeNull()
    expect(await visits.listRecentPatients(VET, 10)).toEqual([])
    expect((await visits.search(VET, { page: 1, pageSize: 20 })).total).toBe(0)
    expect(await vaccines.listDue(VET, new Date('2100-01-01'))).toEqual([])
    expect(await revokedAt(ids.patientShare)).not.toBeNull()
    // O registro continua no banco
    expect(
      await prisma.patient.findUnique({ where: { id: ids.patient } }),
    ).not.toBeNull()
  })

  it('apagar de novo dá 404', async () => {
    const result = await new DeletePatient(patients).execute({
      userId: VET,
      patientId: ids.patient,
    })

    expect(result.isLeft() && result.value.code).toBe('PATIENT_NOT_FOUND')
  })

  it('o microchip fica livre para um paciente novo', async () => {
    expect(await patients.microchipInUse(MICROCHIP, VET)).toBe(false)
    await expect(
      prisma.patient.create({
        data: {
          userId: VET,
          breedId,
          name: 'Thor de novo',
          sex: 'male',
          birthDate: new Date('2020-01-01'),
          microchip: MICROCHIP,
        },
      }),
    ).resolves.toBeDefined()
  })

  it('sem pacientes, o tutor sai, o código dele cai e o CPF fica livre', async () => {
    const result = await new DeleteGuardian(guardians).execute({
      userId: VET,
      guardianId: ids.guardian,
    })

    expect(result.isRight()).toBe(true)
    expect(await guardians.findById(ids.guardian, VET)).toBeNull()
    expect(await guardians.findByCpf(CPF, VET)).toBeNull()
    expect(await revokedAt(ids.guardianShare)).not.toBeNull()
    await expect(
      prisma.guardian.create({
        data: {
          userId: VET,
          name: 'Tutor de novo',
          phone: '21999990000',
          email: 'tutor@test.com',
          cpf: CPF,
          birthDate: new Date('1990-01-01'),
        },
      }),
    ).resolves.toBeDefined()
  })
})
