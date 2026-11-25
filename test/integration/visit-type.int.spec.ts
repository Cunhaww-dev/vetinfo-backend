import { randomUUID } from 'node:crypto'
import { beforeAll, describe, expect, it } from 'vitest'
import { PrismaVisitRepository } from '../../src/modules/visits/infra/prisma-visit.repository.ts'
import { prisma } from '../../src/shared/prisma/client.ts'

// A tela de atendimentos filtra pelo tipo e pelo status, e mostra as vacinas da vacinação

const VET = randomUUID()
const ids = {
  patient: randomUUID(),
  consultation: randomUUID(),
  vaccination: randomUUID(),
}
const visits = new PrismaVisitRepository(prisma)

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
  await prisma.patient.create({
    data: {
      id: ids.patient,
      userId: VET,
      breedId: breed.id,
      name: 'Thor',
      sex: 'male',
      birthDate: new Date('2020-01-01'),
    },
  })
  const visit = (id: string, type: 'consultation' | 'vaccination') =>
    prisma.visit.create({
      data: {
        id,
        userId: VET,
        patientId: ids.patient,
        authorType: 'professional',
        type,
        visitedAt: new Date(),
        soap: { create: {} },
      },
    })
  await visit(ids.consultation, 'consultation')
  await visit(ids.vaccination, 'vaccination')
  for (const name of ['V10', 'Antirrábica'])
    await prisma.vaccine.create({
      data: {
        userId: VET,
        patientId: ids.patient,
        visitId: ids.vaccination,
        name,
        appliedAt: new Date(),
      },
    })
})

describe('tipo do atendimento', () => {
  it('sem filtro, vêm os 2 tipos', async () => {
    const { total } = await visits.search(VET, { page: 1, pageSize: 20 })
    expect(total).toBe(2)
  })

  it('o filtro de vacinação traz só ela, com as vacinas', async () => {
    const { items } = await visits.search(VET, {
      type: 'vaccination',
      page: 1,
      pageSize: 20,
    })

    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      id: ids.vaccination,
      type: 'vaccination',
      vaccines: ['V10', 'Antirrábica'],
    })
  })

  it('o tipo volta do banco', async () => {
    const visit = await visits.findById(ids.vaccination, VET)
    expect(visit?.type).toBe('vaccination')
  })
})

describe('status do atendimento', () => {
  it('o filtro separa os em andamento dos finalizados', async () => {
    const visit = await visits.findById(ids.consultation, VET)
    await visits.update(visit!.finish())

    const open = await visits.search(VET, {
      status: 'open',
      page: 1,
      pageSize: 20,
    })
    const finished = await visits.search(VET, {
      status: 'finished',
      page: 1,
      pageSize: 20,
    })

    expect(open.items.map(({ id }) => id)).toEqual([ids.vaccination])
    expect(finished.items.map(({ id }) => id)).toEqual([ids.consultation])
    expect(finished.items[0].finishedAt).toBeInstanceOf(Date)
  })
})

describe('vacinas do atendimento', () => {
  it('conta só as vacinas vivas do atendimento', async () => {
    expect(await visits.countVaccines(ids.vaccination, VET)).toBe(2)
    expect(await visits.countVaccines(ids.consultation, VET)).toBe(0)
    // Outro usuário não enxerga as vacinas
    expect(await visits.countVaccines(ids.vaccination, randomUUID())).toBe(0)
  })
})
