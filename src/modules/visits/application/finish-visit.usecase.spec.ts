import { describe, expect, it } from 'vitest'
import { Visit } from '../domain/visit-entity.ts'
import type { VisitRepository } from '../domain/visit-repository.ts'
import { FinishVisit } from './finish-visit.usecase.ts'

// Só o que o FinishVisit usa: buscar, contar as vacinas e salvar
const setup = (type: Visit['type'], vaccines: number) => {
  const visit = Visit.create({
    userId: 'vet-a',
    patientId: 'thor',
    authorType: 'professional',
    patientBirthDate: new Date('2020-01-01'),
    bodyConditionScale: '1-9',
    type,
  }).value as Visit
  let saved: Visit | undefined
  const repo = {
    findById: async (id: string) => (id === visit.id ? visit : null),
    countVaccines: async () => vaccines,
    update: async (changed: Visit) => {
      saved = changed
    },
  } as unknown as VisitRepository
  const finish = (visitId = visit.id) =>
    new FinishVisit(repo).execute({ userId: 'vet-a', visitId })
  return { visit, finish, saved: () => saved }
}

describe('FinishVisit', () => {
  it('finaliza a consulta, mesmo sem vacina', async () => {
    const { finish, saved } = setup('consultation', 0)
    const result = await finish()
    expect(result.isRight()).toBe(true)
    expect(saved()?.finishedAt).toBeInstanceOf(Date)
  })

  it('não finaliza a vacinação sem vacina', async () => {
    const { finish, saved } = setup('vaccination', 0)
    const result = await finish()
    expect(result.value).toMatchObject({
      code: 'VACCINATION_VISIT_WITHOUT_VACCINE',
    })
    expect(saved()).toBeUndefined()
  })

  it('finaliza a vacinação com pelo menos 1 vacina', async () => {
    const { finish, saved } = setup('vaccination', 1)
    expect((await finish()).isRight()).toBe(true)
    expect(saved()?.finishedAt).toBeInstanceOf(Date)
  })

  it('atendimento de outro usuário ou que não existe: 404', async () => {
    const { finish } = setup('consultation', 0)
    expect((await finish('other')).value).toMatchObject({
      code: 'VISIT_NOT_FOUND',
    })
  })
})
