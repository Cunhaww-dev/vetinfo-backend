import { randomUUID } from 'node:crypto'
import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { Address, type AddressInput } from './address.ts'
import { Cpf } from './cpf.ts'
import { InvalidBirthDate } from './errors/invalid-birth-date.ts'
import { Phone } from './phone.ts'

type CreateGuardianInput = {
  userId: string
  name: string
  phone: string
  email: string
  cpf?: string | null | undefined
  birthDate: Date
  address?: AddressInput | null | undefined
}

// undefined = não mexer no campo. null = apagar o campo (só o CPF pode ser apagado).
type UpdateGuardianInput = {
  name?: string | undefined
  phone?: string | undefined
  email?: string | undefined
  cpf?: string | null | undefined
  birthDate?: Date | undefined
}

type RestoreGuardianProps = {
  id: string
  userId: string
  name: string
  phone: string
  email: string
  cpf: Cpf | null
  birthDate: Date
  address: Address | null
  createdAt: Date
}

function isInTheFuture(date: Date): boolean {
  return date.getTime() > Date.now()
}

// Sem CPF é null. Com CPF, ele precisa ser válido.
function toCpf(
  input: string | null | undefined,
): Either<DomainError, Cpf | null> {
  if (!input?.trim()) return right(null)
  return Cpf.create(input)
}

export class Guardian {
  private constructor(
    readonly id: string,
    readonly userId: string, // o usuário dono do registro (escopo)
    readonly name: string,
    readonly phone: string,
    readonly email: string,
    readonly cpf: Cpf | null,
    readonly birthDate: Date,
    readonly address: Address | null, // só o endereço atual. O histórico fica no banco
    readonly createdAt: Date,
  ) {}

  static create(input: CreateGuardianInput): Either<DomainError, Guardian> {
    if (isInTheFuture(input.birthDate)) return left(new InvalidBirthDate())

    const phone = Phone.create(input.phone)
    if (phone.isLeft()) return left(phone.value)

    const cpf = toCpf(input.cpf)
    if (cpf.isLeft()) return left(cpf.value)

    let address: Address | null = null

    if (input.address) {
      const result = Address.create(input.address)
      if (result.isLeft()) return left(result.value)
      address = result.value
    }

    return right(
      new Guardian(
        randomUUID(),
        input.userId,
        input.name.trim(),
        phone.value.value,
        input.email.trim().toLowerCase(),
        cpf.value,
        input.birthDate,
        address,
        new Date(),
      ),
    )
  }

  update(changes: UpdateGuardianInput): Either<DomainError, Guardian> {
    const birthDate = changes.birthDate ?? this.birthDate
    if (isInTheFuture(birthDate)) return left(new InvalidBirthDate())

    const phone: Either<DomainError, Phone> =
      changes.phone === undefined
        ? right(Phone.restore(this.phone))
        : Phone.create(changes.phone)
    if (phone.isLeft()) return left(phone.value)

    const cpf: Either<DomainError, Cpf | null> =
      changes.cpf === undefined ? right(this.cpf) : toCpf(changes.cpf)
    if (cpf.isLeft()) return left(cpf.value)

    return right(
      new Guardian(
        this.id,
        this.userId,
        changes.name?.trim() ?? this.name,
        phone.value.value,
        changes.email?.trim().toLowerCase() ?? this.email,
        cpf.value,
        birthDate,
        this.address,
        this.createdAt,
      ),
    )
  }

  // Mudar de endereço devolve um Guardian novo. O antigo vira histórico no repositório.
  moveTo(input: AddressInput): Either<DomainError, Guardian> {
    const result = Address.create(input)
    if (result.isLeft()) return left(result.value)

    return right(
      new Guardian(
        this.id,
        this.userId,
        this.name,
        this.phone,
        this.email,
        this.cpf,
        this.birthDate,
        result.value,
        this.createdAt,
      ),
    )
  }

  static restore(props: RestoreGuardianProps): Guardian {
    return new Guardian(
      props.id,
      props.userId,
      props.name,
      props.phone,
      props.email,
      props.cpf,
      props.birthDate,
      props.address,
      props.createdAt,
    )
  }
}
