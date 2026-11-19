import { randomInt } from 'node:crypto'

// Sem 0/O, 1/I/L: o código é lido e digitado por pessoas
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const LENGTH = 10 // 31^10 ≈ 8 x 10^14 códigos

// crypto.randomInt, e não Math.random: o código é a única chave de acesso
export function generateShareCode(): string {
  let code = ''
  for (let i = 0; i < LENGTH; i++) code += ALPHABET[randomInt(ALPHABET.length)]
  return code
}

// O usuário pode digitar em minúsculas ou com espaços
export function normalizeShareCode(input: string): string {
  return input.replace(/\s/g, '').toUpperCase()
}
