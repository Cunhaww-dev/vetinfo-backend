import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import type { AddressInput } from '../domain/address.ts'
import { CpfAlreadyInUse } from '../domain/errors/cpf-already-in-use.ts'
import { Guardian } from '../domain/guardian-entity.ts'
import type { GuardianRepository } from '../domain/guardian-repository.ts'

type CreateGuardianInput = {
  userId: string
  name: string
  phone: string
  email: string
  cpf?: string | null | undefined
  birthDate: Date
  address?: AddressInput | null | undefined
}

export class CreateGuardian {
  constructor(private readonly guardians: GuardianRepository) {}

  async execute(
    input: CreateGuardianInput,
  ): Promise<Either<DomainError, Guardian>> {
    const result = Guardian.create(input)
    if (result.isLeft()) return left(result.value)

    const guardian = result.value

    // Busca pelo CPF já limpo (só dígitos), o mesmo valor que vai para o banco
    if (guardian.cpf) {
      const existing = await this.guardians.findByCpf(
        guardian.cpf.value,
        input.userId,
      )
      if (existing) return left(new CpfAlreadyInUse(guardian.cpf.value))
    }

    await this.guardians.create(guardian)

    return right(guardian)
  }
}
