import { describe, expect, it } from 'vitest'
import { Medication } from './medication-entity.ts'

const DAY_MS = 24 * 60 * 60 * 1000
const day = (offset: number) =>
  new Date(new Date(Date.now() + offset * DAY_MS).toISOString().slice(0, 10))

function create(startDate: Date, endDate: Date | null = null) {
  return Medication.create({
    userId: 'user-1',
    visitId: 'visit-1',
    name: ' Amoxicilina ',
    dosage: '10 mg/kg',
    frequency: '12/12h',
    route: 'oral',
    startDate,
    endDate,
  })
}

describe('Medication', () => {
  it('cria a medicação com o nome sem espaços nas pontas', () => {
    const medication = create(day(0)).value as Medication

    expect(medication.name).toBe('Amoxicilina')
    expect(medication.continuousUse).toBe(false)
  })

  it('recusa término antes do início', () => {
    const result = create(day(0), day(-1))

    expect(result.isLeft()).toBe(true)
    expect(result.value).toMatchObject({ code: 'INVALID_MEDICATION_DATES' })
  })

  it('fica ativa sem término e até o dia do término', () => {
    expect((create(day(-5)).value as Medication).active).toBe(true)
    expect((create(day(-5), day(0)).value as Medication).active).toBe(true)
    expect((create(day(-5), day(-1)).value as Medication).active).toBe(false)
  })

  it('na edição, null apaga o término e undefined não mexe', () => {
    const medication = create(day(-5), day(-1)).value as Medication

    expect((medication.update({}).value as Medication).endDate).toEqual(day(-1))
    expect(
      (medication.update({ endDate: null }).value as Medication).endDate,
    ).toBeNull()
  })

  it('na edição, confere as datas de novo', () => {
    const medication = create(day(-5), day(-1)).value as Medication

    expect(medication.update({ startDate: day(0) }).isLeft()).toBe(true)
  })
})
