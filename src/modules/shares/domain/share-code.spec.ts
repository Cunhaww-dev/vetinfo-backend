import { describe, expect, it } from 'vitest'
import { generateShareCode, normalizeShareCode } from './share-code.ts'

describe('share code', () => {
  it('tem 10 caracteres, sem 0, O, 1, I e L', () => {
    for (let i = 0; i < 200; i++) {
      expect(generateShareCode()).toMatch(/^[A-HJKMNP-Z2-9]{10}$/)
    }
  })

  it('aceita o código digitado em minúsculas e com espaços', () => {
    expect(normalizeShareCode(' abcde fghjk ')).toBe('ABCDEFGHJK')
  })
})
