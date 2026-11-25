import { describe, expect, it } from 'vitest'
import { searchVisitsQuerySchema } from './visit.schema.ts'

describe('searchVisitsQuerySchema', () => {
  it('usa 10 itens por página por padrão', () => {
    expect(searchVisitsQuerySchema.parse({}).pageSize).toBe(10)
  })

  it('aceita os tamanhos da lista', () => {
    for (const size of ['10', '20', '30', '40', '50'])
      expect(searchVisitsQuerySchema.parse({ pageSize: size }).pageSize).toBe(
        Number(size),
      )
  })

  it('volta para 10 quando o tamanho não está na lista', () => {
    for (const size of ['1000', '15', '0', 'abc'])
      expect(searchVisitsQuerySchema.parse({ pageSize: size }).pageSize).toBe(
        10,
      )
  })
})
