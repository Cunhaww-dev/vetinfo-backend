import { describe, expect, it } from 'vitest'
import type { BodyConditionScale } from '../../catalog/domain/body-condition-scale.ts'
import { Visit } from './visit-entity.ts'

const birthDate = new Date('2024-01-10')
const dog = { birthDate, bodyConditionScale: '1-9' as const }

function create(
  visitedAt: string,
  vitalSigns = {},
  bodyConditionScale: BodyConditionScale = '1-9',
) {
  return Visit.create({
    userId: 'user-1',
    patientId: 'patient-1',
    authorType: 'student',
    patientBirthDate: birthDate,
    bodyConditionScale,
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
    const bornLater = { ...dog, birthDate: new Date('2024-03-01') }

    expect(
      visit.update({ soap: { plan: 'Retorno' } }, bornLater).isRight(),
    ).toBe(true)
    expect(
      visit.update({ visitedAt: new Date('2024-02-02') }, bornLater).isLeft(),
    ).toBe(true)
  })

  it('escore corporal na escala 1-9: só inteiros de 1 a 9', () => {
    const nine = create('2024-02-01T10:00:00Z', { bodyConditionScore: 9 })
    expect((nine.value as Visit).vitalSigns.bodyConditionScale).toBe('1-9')
    expect(
      create('2024-02-01T10:00:00Z', { bodyConditionScore: 10 }).value,
    ).toMatchObject({ code: 'INVALID_VITAL_SIGNS' })
    expect(
      create('2024-02-01T10:00:00Z', { bodyConditionScore: 4.5 }).isLeft(),
    ).toBe(true)
  })

  it('escore corporal na escala 1-5: passo de 0,5', () => {
    const at = '2024-02-01T10:00:00Z'
    expect(create(at, { bodyConditionScore: 3.5 }, '1-5').isRight()).toBe(true)
    expect(create(at, { bodyConditionScore: 6 }, '1-5').isLeft()).toBe(true)
    expect(create(at, { bodyConditionScore: 3.25 }, '1-5').isLeft()).toBe(true)
  })

  it('peso: aceita 1 g, recusa menos', () => {
    const at = '2024-02-01T10:00:00Z'
    expect(create(at, { weightKg: 0.001 }).isRight()).toBe(true)
    expect(create(at, { weightKg: 0.0009 }).value).toMatchObject({
      code: 'INVALID_VITAL_SIGNS',
    })
  })

  it('sem escore, a escala fica null', () => {
    const visit = create('2024-02-01T10:00:00Z').value as Visit
    expect(visit.vitalSigns.bodyConditionScale).toBeNull()
  })

  it('editar outro sinal mantém a escala do escore salvo', () => {
    const visit = create('2024-02-01T10:00:00Z', { bodyConditionScore: 7 })
      .value as Visit
    // A espécie mudou para uma de escala 1-5, mas o escore não foi tocado
    const updated = visit.update(
      { vitalSigns: { weightKg: 10 } },
      { birthDate, bodyConditionScale: '1-5' },
    ).value as Visit
    expect(updated.vitalSigns.bodyConditionScore).toBe(7)
    expect(updated.vitalSigns.bodyConditionScale).toBe('1-9')
  })

  it('o tipo do autor não muda na edição (snapshot)', () => {
    const visit = create('2024-02-01T10:00:00Z').value as Visit
    const updated = visit.update({ soap: { plan: 'x' } }, dog).value as Visit

    expect(updated.authorType).toBe('student')
  })

  describe('vacinação', () => {
    const vaccination = (soap = {}) =>
      Visit.create({
        userId: 'user-1',
        patientId: 'patient-1',
        authorType: 'professional',
        type: 'vaccination',
        patientBirthDate: birthDate,
        bodyConditionScale: '1-9',
        visitedAt: new Date('2024-02-01T10:00:00Z'),
        vitalSigns: { weightKg: 8 },
        soap,
      })

    it('sem o tipo, o atendimento é consulta', () => {
      const visit = create('2024-02-01T10:00:00Z').value as Visit
      expect(visit.type).toBe('consultation')
    })

    it('aceita sinais vitais e SOAP vazio', () => {
      const visit = vaccination({ plan: '   ' }).value as Visit
      expect(visit.type).toBe('vaccination')
      expect(visit.vitalSigns.weightKg).toBe(8)
      expect(visit.soap.isEmpty()).toBe(true)
    })

    it('recusa SOAP na criação', () => {
      expect(vaccination({ assessment: 'Gastroenterite' }).value).toMatchObject(
        { code: 'VACCINATION_VISIT_HAS_NO_SOAP' },
      )
    })

    it('recusa SOAP na edição, e o tipo não muda', () => {
      const visit = vaccination().value as Visit
      expect(
        visit.update({ soap: { plan: 'Retorno' } }, dog).value,
      ).toMatchObject({ code: 'VACCINATION_VISIT_HAS_NO_SOAP' })

      const updated = visit.update({ vitalSigns: { weightKg: 9 } }, dog)
        .value as Visit
      expect(updated.type).toBe('vaccination')
    })
  })
})
