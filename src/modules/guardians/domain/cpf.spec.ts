import { describe, expect, it } from 'vitest'
import { Cpf } from './cpf.ts'

describe('Cpf', () => {
  it('aceita CPF com máscara e guarda só os números', () => {
    const result = Cpf.create('529.982.247-25')

    expect(result.isRight()).toBe(true)
    expect((result.value as Cpf).value).toBe('52998224725')
  })

  it('aceita CPF sem máscara', () => {
    expect(Cpf.create('11144477735').isRight()).toBe(true)
  })

  it('recusa dígito verificador errado', () => {
    const result = Cpf.create('529.982.247-26')

    expect(result.isLeft()).toBe(true)
    expect(result.value).toMatchObject({ code: 'INVALID_CPF' })
  })

  it('recusa CPF com todos os dígitos iguais', () => {
    expect(Cpf.create('111.111.111-11').isLeft()).toBe(true)
  })

  it('recusa CPF sem 11 dígitos', () => {
    expect(Cpf.create('5299822472').isLeft()).toBe(true)
    expect(Cpf.create('529982247250').isLeft()).toBe(true)
  })
})
