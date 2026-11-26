import { describe, expect, it } from 'vitest'
import { Vaccine } from '../domain/vaccine-entity.ts'
import type { VaccineRepository } from '../domain/vaccine-repository.ts'
import { DeleteVaccine } from './delete-vaccine.usecase.ts'

// Só o que o DeleteVaccine usa: buscar a vacina e o atendimento, e apagar
const setup = (visit: { finishedAt: Date | null } | null) => {
  const vaccine = Vaccine.create({
    userId: 'vet-a',
    patientId: 'thor',
    patientBirthDate: new Date('2020-01-01'),
    visitId: visit ? 'visit-1' : null,
    name: 'V10',
    appliedAt: new Date('2024-05-10'),
  }).value as Vaccine
  let deleted = false
  const repo = {
    findById: async (id: string) => (id === vaccine.id ? vaccine : null),
    findVisit: async () =>
      visit && {
        id: 'visit-1',
        patientId: 'thor',
        visitedAt: new Date(),
        ...visit,
      },
    softDelete: async () => {
      deleted = true
      return true
    },
  } as unknown as VaccineRepository
  const remove = (vaccineId = vaccine.id) =>
    new DeleteVaccine(repo).execute({ userId: 'vet-a', vaccineId })
  return { remove, deleted: () => deleted }
}

describe('DeleteVaccine', () => {
  it('apaga a vacina de um atendimento em andamento', async () => {
    const { remove, deleted } = setup({ finishedAt: null })
    expect((await remove()).isRight()).toBe(true)
    expect(deleted()).toBe(true)
  })

  it('apaga a vacina sem atendimento', async () => {
    const { remove, deleted } = setup(null)
    expect((await remove()).isRight()).toBe(true)
    expect(deleted()).toBe(true)
  })

  it('não apaga a vacina de um atendimento finalizado', async () => {
    const { remove, deleted } = setup({ finishedAt: new Date() })
    expect((await remove()).value).toMatchObject({
      code: 'VACCINE_IN_FINISHED_VISIT',
    })
    expect(deleted()).toBe(false)
  })

  it('vacina de outro usuário ou que não existe: 404', async () => {
    const { remove, deleted } = setup(null)
    expect((await remove('other')).value).toMatchObject({
      code: 'VACCINE_NOT_FOUND',
    })
    expect(deleted()).toBe(false)
  })
})
