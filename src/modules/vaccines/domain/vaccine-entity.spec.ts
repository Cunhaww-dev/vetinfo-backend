import { describe, expect, it } from 'vitest'
import { Vaccine } from './vaccine-entity.ts'

const birthDate = new Date('2020-01-01')

function create(appliedAt: string, nextDoseAt: string | null = null) {
  return Vaccine.create({
    userId: 'user-1',
    patientId: 'patient-1',
    patientBirthDate: birthDate,
    name: 'V10',
    appliedAt: new Date(appliedAt),
    nextDoseAt: nextDoseAt ? new Date(nextDoseAt) : null,
    batch: '  ',
  })
}

describe('Vaccine', () => {
  it('cria a vacina sem atendimento, e texto vazio vira null', () => {
    const vaccine = create('2024-05-10', '2025-05-10').value as Vaccine

    expect(vaccine.visitId).toBeNull()
    expect(vaccine.batch).toBeNull()
  })

  it('recusa aplicação no futuro', () => {
    expect(create('2099-01-01').value).toMatchObject({
      code: 'INVALID_VACCINE_DATES',
    })
  })

  it('recusa aplicação antes do nascimento', () => {
    expect(create('2019-12-31').isLeft()).toBe(true)
  })

  it('recusa próxima dose no mesmo dia ou antes da aplicação', () => {
    expect(create('2024-05-10', '2024-05-10').isLeft()).toBe(true)
    expect(create('2024-05-10', '2024-05-01').isLeft()).toBe(true)
  })

  it('na edição, confere as datas com o nascimento', () => {
    const vaccine = create('2024-05-10').value as Vaccine

    const result = vaccine.update(
      { appliedAt: new Date('2019-01-01') },
      birthDate,
    )

    expect(result.isLeft()).toBe(true)
  })
})
