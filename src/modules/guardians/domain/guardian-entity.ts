import { randomUUID } from 'node:crypto'
import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { Address, type AddressInput } from './address.ts'

type CreateGuardianInput = {
  userId: string
  name: string
  phone?: string | null | undefined
  email?: string | null | undefined
  address?: AddressInput | null | undefined
}

// undefined = não mexer no campo. null = apagar o campo.
type UpdateGuardianInput = {
  name?: string | undefined
  phone?: string | null | undefined
  email?: string | null | undefined
}

type RestoreGuardianProps = {
  id: string
  userId: string
  name: string
  phone: string | null
  email: string | null
  address: Address | null
  createdAt: Date
}

export class Guardian {
  private constructor(
    readonly id: string,
    readonly userId: string, // o usuário dono do registro (escopo)
    readonly name: string,
    readonly phone: string | null,
    readonly email: string | null,
    readonly address: Address | null, // só o endereço atual. O histórico fica no banco
    readonly createdAt: Date,
  ) {}

  static create(input: CreateGuardianInput): Either<DomainError, Guardian> {
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
        input.phone?.trim() || null,
        input.email?.trim().toLowerCase() || null,
        address,
        new Date(),
      ),
    )
  }

  update(changes: UpdateGuardianInput): Guardian {
    return new Guardian(
      this.id,
      this.userId,
      changes.name?.trim() ?? this.name,
      changes.phone === undefined ? this.phone : changes.phone?.trim() || null,
      changes.email === undefined
        ? this.email
        : changes.email?.trim().toLowerCase() || null,
      this.address,
      this.createdAt,
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
      props.address,
      props.createdAt,
    )
  }
}
