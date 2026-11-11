import { describe, expect, it } from 'vitest'
import { User } from './user-entity.ts'

function student() {
  return User.restore({
    id: 'user-1',
    name: 'Ana',
    email: 'ana@test.com',
    type: 'student',
    crmv: null,
    createdAt: new Date('2026-01-01'),
    crmvActivatedAt: null,
  })
}

describe('User.activateCrmv', () => {
  it('estudante vira profissional com o CRMV normalizado', () => {
    const result = student().activateCrmv(' sp12345 ')

    expect(result.isRight()).toBe(true)
    const user = result.value as User
    expect(user.type).toBe('professional')
    expect(user.crmv).toBe('SP12345')
    expect(user.crmvActivatedAt).toBeInstanceOf(Date)
  })

  it('mantém o id, o nome e a data de cadastro', () => {
    const user = student().activateCrmv('SP12345').value as User

    expect(user.id).toBe('user-1')
    expect(user.name).toBe('Ana')
    expect(user.createdAt).toEqual(new Date('2026-01-01'))
  })

  it('recusa CRMV fora do formato UF + números', () => {
    const result = student().activateCrmv('12345')

    expect(result.isLeft()).toBe(true)
    expect(result.value).toMatchObject({ code: 'INVALID_CRMV_FORMAT' })
  })

  it('profissional não ativa de novo (sem volta)', () => {
    const professional = student().activateCrmv('SP12345').value as User
    const result = professional.activateCrmv('RJ999')

    expect(result.isLeft()).toBe(true)
    expect(result.value).toMatchObject({ code: 'CRMV_ALREADY_ACTIVATED' })
  })
})
