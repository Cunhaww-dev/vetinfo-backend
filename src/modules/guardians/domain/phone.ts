import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { InvalidPhone } from './errors/invalid-phone.ts'

// Os 67 DDDs que existem no Brasil (Anatel). "00" ou "20" não existem.
const DDDS = new Set(
  (
    '11 12 13 14 15 16 17 18 19 21 22 24 27 28 31 32 33 34 35 37 38 ' +
    '41 42 43 44 45 46 47 48 49 51 53 54 55 61 62 63 64 65 66 67 68 69 ' +
    '71 73 74 75 77 79 81 82 83 84 85 86 87 88 89 91 92 93 94 95 96 97 98 99'
  ).split(' '),
)

// Value object: aceita "(21) 99999-0000" e guarda "21999990000".
// DDD + 8 números (fixo) ou DDD + 9 números (celular).
export class Phone {
  private constructor(readonly value: string) {}

  static create(input: string): Either<DomainError, Phone> {
    const digits = input.replace(/\D/g, '')

    if (digits.length !== 10 && digits.length !== 11)
      return left(new InvalidPhone(input))
    if (!DDDS.has(digits.slice(0, 2))) return left(new InvalidPhone(input))

    return right(new Phone(digits))
  }

  static restore(value: string): Phone {
    return new Phone(value)
  }
}
