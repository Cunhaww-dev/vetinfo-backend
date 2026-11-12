import { describe, expect, it } from 'vitest'
import { Phone } from './phone.ts'

describe('Phone', () => {
  it('aceita celular com máscara e guarda só os números', () => {
    const result = Phone.create('(21) 99999-0000')

    expect(result.isRight()).toBe(true)
    expect((result.value as Phone).value).toBe('21999990000')
  })

  it('aceita telefone fixo com 10 números', () => {
    expect(Phone.create('1133334444').isRight()).toBe(true)
  })

  it('recusa DDD que não existe', () => {
    const result = Phone.create('20999990000')

    expect(result.isLeft()).toBe(true)
    expect(result.value).toMatchObject({ code: 'INVALID_PHONE' })
  })

  it('recusa telefone curto ou longo demais', () => {
    expect(Phone.create('2199999').isLeft()).toBe(true)
    expect(Phone.create('219999900001').isLeft()).toBe(true)
  })
})
