import { randomUUID } from 'node:crypto'
import { beforeAll, describe, expect, it } from 'vitest'
import { PrismaAttachmentRepository } from '../../src/modules/attachments/infra/prisma-attachment.repository.ts'
import { PrismaConsentRepository } from '../../src/modules/consents/infra/prisma-consent.repository.ts'
import { PrismaGuardianRepository } from '../../src/modules/guardians/infra/prisma-guardian.repository.ts'
import { PrismaMedicationRepository } from '../../src/modules/medications/infra/prisma-medication.repository.ts'
import { PrismaPatientRepository } from '../../src/modules/patients/infra/prisma-patient.repository.ts'
import { PrismaShareRepository } from '../../src/modules/shares/infra/prisma-share.repository.ts'
import { PrismaVaccineRepository } from '../../src/modules/vaccines/infra/prisma-vaccine.repository.ts'
import { PrismaVisitRepository } from '../../src/modules/visits/infra/prisma-visit.repository.ts'
import { prisma } from '../../src/shared/prisma/client.ts'

// O teste negativo que o Plano pede (Fase 1): o usuário B nunca enxerga o dado do A.
// O A cria um registro de cada tipo. O B procura cada um pelo id e pelas listas.

const A = randomUUID()
const B = randomUUID()
const ids = {
  guardian: randomUUID(),
  patient: randomUUID(),
  visit: randomUUID(),
  medication: randomUUID(),
  vaccine: randomUUID(),
  attachment: randomUUID(),
  consent: randomUUID(),
  share: randomUUID(),
}

beforeAll(async () => {
  // Trava de segurança: o TRUNCATE só roda no banco de teste
  if (!process.env.DATABASE_URL?.includes('_test'))
    throw new Error('Integration tests must run on the _test database')

  await prisma.$executeRawUnsafe('TRUNCATE TABLE "users" CASCADE')

  const user = (id: string) => ({
    id,
    name: id === A ? 'Vet A' : 'Vet B',
    email: `${id}@test.com`,
    type: 'professional' as const,
  })
  await prisma.user.createMany({ data: [user(A), user(B)] })

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
  const type = await prisma.attachmentType.upsert({
    where: { name: 'Laudo' },
    update: {},
    create: { name: 'Laudo' },
  })

  await prisma.guardian.create({
    data: {
      id: ids.guardian,
      userId: A,
      name: 'Tutor A',
      phone: '21999990000',
      email: 'tutor@a.com',
      cpf: '52998224725',
      birthDate: new Date('1990-01-01'),
    },
  })
  await prisma.patient.create({
    data: {
      id: ids.patient,
      userId: A,
      guardianId: ids.guardian,
      breedId: breed.id,
      name: 'Thor',
      sex: 'male',
      birthDate: new Date('2020-01-01'),
      microchip: '985000000000001',
    },
  })
  await prisma.visit.create({
    data: {
      id: ids.visit,
      userId: A,
      patientId: ids.patient,
      authorType: 'professional',
      visitedAt: new Date(),
      weightKg: 30,
      soap: { create: { plan: 'Retorno' } },
    },
  })
  await prisma.medication.create({
    data: {
      id: ids.medication,
      userId: A,
      visitId: ids.visit,
      name: 'Amoxicilina',
      dosage: '10 mg/kg',
      frequency: '12/12h',
      route: 'oral',
      startDate: new Date('2026-01-01'),
    },
  })
  await prisma.vaccine.create({
    data: {
      id: ids.vaccine,
      userId: A,
      patientId: ids.patient,
      visitId: ids.visit,
      name: 'V10',
      appliedAt: new Date('2026-01-01'),
      nextDoseAt: new Date('2026-02-01'),
    },
  })
  await prisma.attachment.create({
    data: {
      id: ids.attachment,
      userId: A,
      visitId: ids.visit,
      typeId: type.id,
      fileName: 'laudo.pdf',
      contentType: 'application/pdf',
      sizeBytes: 10,
      storageKey: `attachments/${A}/${ids.attachment}`,
    },
  })
  await prisma.guardianConsent.create({
    data: {
      id: ids.consent,
      userId: A,
      guardianId: ids.guardian,
      patientId: ids.patient,
      termVersion: '1',
      acceptedAt: new Date(),
    },
  })
  await prisma.share.create({
    data: {
      id: ids.share,
      userId: A,
      type: 'third_party',
      code: randomUUID().slice(0, 10).toUpperCase(),
      expiresAt: new Date(Date.now() + 86_400_000),
      items: { create: { patientId: ids.patient } },
    },
  })
})

describe('escopo por usuário: B não enxerga o dado de A', () => {
  it('tutor', async () => {
    const repo = new PrismaGuardianRepository(prisma)

    expect(await repo.findById(ids.guardian, A)).not.toBeNull()
    expect(await repo.findById(ids.guardian, B)).toBeNull()
    expect(await repo.findByCpf('52998224725', B)).toBeNull()
    expect(await repo.listByUser(B)).toEqual([])
  })

  it('paciente', async () => {
    const repo = new PrismaPatientRepository(prisma)

    expect(await repo.findById(ids.patient, A)).not.toBeNull()
    expect(await repo.findById(ids.patient, B)).toBeNull()
    expect(await repo.listByUser(B, {})).toEqual([])
    expect(await repo.guardianExists(ids.guardian, B)).toBe(false)
    expect(await repo.microchipInUse('985000000000001', B)).toBe(false)
  })

  it('atendimento', async () => {
    const repo = new PrismaVisitRepository(prisma)

    expect(await repo.findById(ids.visit, A)).not.toBeNull()
    expect(await repo.findById(ids.visit, B)).toBeNull()
    expect(await repo.listByPatient(ids.patient, B)).toEqual([])
    expect(await repo.findLatestWithVitalSigns(ids.patient, B)).toBeNull()
    expect(await repo.findPatient(ids.patient, B)).toBeNull()
    expect(await repo.listRecentPatients(B, 10)).toEqual([])
    expect(await repo.search(B, { page: 1, pageSize: 20 })).toEqual({
      items: [],
      total: 0,
    })
    const ofA = await repo.search(A, { page: 1, pageSize: 20 })
    expect(ofA.items.map((item) => item.id)).toEqual([ids.visit])
  })

  it('medicação', async () => {
    const repo = new PrismaMedicationRepository(prisma)

    expect(await repo.findById(ids.medication, A)).not.toBeNull()
    expect(await repo.findById(ids.medication, B)).toBeNull()
    expect(await repo.listByVisit(ids.visit, B)).toEqual([])
    expect(await repo.listByPatient(ids.patient, B)).toEqual([])
    expect(await repo.findVisit(ids.visit, B)).toBeNull()
  })

  it('vacina', async () => {
    const repo = new PrismaVaccineRepository(prisma)
    const farFuture = new Date('2099-01-01')

    expect(await repo.findById(ids.vaccine, A)).not.toBeNull()
    expect(await repo.findById(ids.vaccine, B)).toBeNull()
    expect(await repo.listByPatient(ids.patient, B)).toEqual([])
    expect(await repo.listByVisit(ids.visit, B)).toEqual([])
    expect(await repo.listDue(A, farFuture)).toHaveLength(1)
    expect(await repo.listDue(B, farFuture)).toEqual([])
  })

  it('anexo', async () => {
    const repo = new PrismaAttachmentRepository(prisma)

    expect(await repo.findById(ids.attachment, A)).not.toBeNull()
    expect(await repo.findById(ids.attachment, B)).toBeNull()
    expect(await repo.listByVisit(ids.visit, B)).toEqual([])
    expect(await repo.listByPatient(ids.patient, B)).toEqual([])
    expect(await repo.visitExists(ids.visit, B)).toBe(false)
  })

  it('consentimento', async () => {
    const repo = new PrismaConsentRepository(prisma)

    expect(await repo.findById(ids.consent, A)).not.toBeNull()
    expect(await repo.findById(ids.consent, B)).toBeNull()
    expect(await repo.findPatient(ids.patient, B)).toBeNull()
    expect(await repo.listConsentedPatientIds(A)).toEqual([ids.patient])
    expect(await repo.listConsentedPatientIds(B)).toEqual([])
  })

  it('compartilhamento', async () => {
    const repo = new PrismaShareRepository(prisma)

    expect(await repo.findById(ids.share, A)).not.toBeNull()
    expect(await repo.findById(ids.share, B)).toBeNull()
    expect(await repo.listByUser(B)).toEqual([])
    expect(await repo.findPatients([ids.patient], B)).toEqual([])
  })
})

describe('consentimento no banco', () => {
  it('o índice parcial barra o segundo consentimento ativo do mesmo par', async () => {
    await expect(
      prisma.guardianConsent.create({
        data: {
          userId: A,
          guardianId: ids.guardian,
          patientId: ids.patient,
          termVersion: '2',
          acceptedAt: new Date(),
        },
      }),
    ).rejects.toThrow()
  })

  it('só vale o consentimento do tutor atual do paciente', async () => {
    const repo = new PrismaShareRepository(prisma)
    const patient = { id: ids.patient, guardianId: ids.guardian }

    expect(await repo.withActiveConsent([patient])).toEqual(
      new Set([ids.patient]),
    )
    expect(
      await repo.withActiveConsent([{ ...patient, guardianId: randomUUID() }]),
    ).toEqual(new Set())
  })
})
