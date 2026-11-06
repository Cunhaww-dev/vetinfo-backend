import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import type { AddressInput } from '../domain/address.ts'
import { Guardian } from '../domain/guardian-entity.ts'
import type { GuardianRepository } from '../domain/guardian-repository.ts'

type CreateGuardianInput = {
  userId: string
  name: string
  phone?: string | null | undefined
  email?: string | null | undefined
  address?: AddressInput | null | undefined
}

export class CreateGuardian {
  constructor(private readonly guardians: GuardianRepository) {}

  async execute(
    input: CreateGuardianInput,
  ): Promise<Either<DomainError, Guardian>> {
    const result = Guardian.create(input)
    if (result.isLeft()) return left(result.value)

    await this.guardians.create(result.value)

    return right(result.value)
  }
}
