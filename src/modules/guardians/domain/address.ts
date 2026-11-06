import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { InvalidAddress } from './errors/invalid-address.ts'

export type AddressInput = {
  street: string
  number: string
  complement?: string | null | undefined
  district: string
  city: string
  state: string
  zipCode: string
}

type AddressProps = {
  street: string
  number: string
  complement: string | null
  district: string
  city: string
  state: string
  zipCode: string
}

const STATE_FORMAT = /^[A-Z]{2}$/
const ZIP_CODE_FORMAT = /^\d{8}$/

// Value object: não tem id. Dois endereços com os mesmos campos são o mesmo endereço.
export class Address {
  private constructor(
    readonly street: string,
    readonly number: string,
    readonly complement: string | null,
    readonly district: string,
    readonly city: string,
    readonly state: string,
    readonly zipCode: string,
  ) {}

  static create(input: AddressInput): Either<DomainError, Address> {
    const state = input.state.trim().toUpperCase()
    const zipCode = input.zipCode.replace(/\D/g, '') // aceita "01310-100" e guarda "01310100"

    if (!STATE_FORMAT.test(state))
      return left(new InvalidAddress('state', state))
    if (!ZIP_CODE_FORMAT.test(zipCode))
      return left(new InvalidAddress('zipCode', input.zipCode))

    return right(
      new Address(
        input.street.trim(),
        input.number.trim(),
        input.complement?.trim() || null,
        input.district.trim(),
        input.city.trim(),
        state,
        zipCode,
      ),
    )
  }

  static restore(props: AddressProps): Address {
    return new Address(
      props.street,
      props.number,
      props.complement,
      props.district,
      props.city,
      props.state,
      props.zipCode,
    )
  }
}
