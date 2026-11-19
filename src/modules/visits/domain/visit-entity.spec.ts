import { describe, expect, it } from 'vitest'
import { Visit } from './visit-entity.ts'

const birthDate = new Date('2024-01-10')

function create(visitedAt: string, vitalSigns = {}) {
  return Visit.create({
    userId: 'user-1',
    patientId: 'patient-1',
    authorType: 'student',
    patientBirthDate: birthDate,
    visitedAt: new Date(visitedAt),
    vitalSigns,
  })
}

describe('Visit', () => {
  it('recusa atendimento antes do nascimento', () => {
    expect(create('2024-01-09T10:00:00Z').value).toMatchObject({
      code: 'VISIT_BEFORE_BIRTH',
    })
  })

  it('aceita atendimento no dia do nascimento', () => {
    expect(create('2024-01-10T10:00:00Z').isRight()).toBe(true)
  })

  it('editar só o SOAP funciona, mesmo se o nascimento mudou depois', () => {
    const visit = create('2024-02-01T10:00:00Z').value as Visit
    const newBirthDate = new Date('2024-03-01')

    expect(
      visit.update({ soap: { plan: 'Retorno' } }, newBirthDate).isRight(),
    ).toBe(true)
    expect(
      visit
        .update({ visitedAt: new Date('2024-02-02') }, newBirthDate)
        .isLeft(),
    ).toBe(true)
  })

  it('escore corporal vai de 1 a 9', () => {
    expect(
      create('2024-02-01T10:00:00Z', { bodyConditionScore: 9 }).isRight(),
    ).toBe(true)
    expect(
      create('2024-02-01T10:00:00Z', { bodyConditionScore: 10 }).value,
    ).toMatchObject({
      code: 'INVALID_VITAL_SIGNS',
    })
  })

  it('o tipo do autor não muda na edição (snapshot)', () => {
    const visit = create('2024-02-01T10:00:00Z').value as Visit
    const updated = visit.update({ soap: { plan: 'x' } }, birthDate)
      .value as Visit

    expect(updated.authorType).toBe('student')
  })
})
