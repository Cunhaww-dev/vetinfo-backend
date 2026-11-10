import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { InvalidCpf } from './errors/invalid-cpf.ts'

// Soma os dígitos com pesos que descem até 2 e devolve o dígito verificador.
function checkDigit(digits: string): number {
  const weight = digits.length + 1
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    sum += Number(digits[i]) * (weight - i)
  }
  const rest = sum % 11
  return rest < 2 ? 0 : 11 - rest
}

// Value object: aceita "123.456.789-09" e guarda "12345678909".
export class Cpf {
  private constructor(readonly value: string) {}

  static create(input: string): Either<DomainError, Cpf> {
    const digits = input.replace(/\D/g, '')

    // "111.111.111-11" passa na conta dos dígitos, mas não é um CPF real
    if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits))
      return left(new InvalidCpf(input))

    const first = checkDigit(digits.slice(0, 9))
    const second = checkDigit(digits.slice(0, 10))
    if (first !== Number(digits[9]) || second !== Number(digits[10]))
      return left(new InvalidCpf(input))

    return right(new Cpf(digits))
  }

  static restore(value: string): Cpf {
    return new Cpf(value)
  }
}
