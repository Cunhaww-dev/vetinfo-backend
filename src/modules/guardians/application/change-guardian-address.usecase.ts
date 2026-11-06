import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import type { AddressInput } from '../domain/address.ts'
import { GuardianNotFound } from '../domain/errors/guardian-not-found.ts'
import type { Guardian } from '../domain/guardian-entity.ts'
import type { GuardianRepository } from '../domain/guardian-repository.ts'

type ChangeGuardianAddressInput = {
  userId: string
  guardianId: string
  address: AddressInput
}

export class ChangeGuardianAddress {
  constructor(private readonly guardians: GuardianRepository) {}

  async execute(
    input: ChangeGuardianAddressInput,
  ): Promise<Either<DomainError, Guardian>> {
    const guardian = await this.guardians.findById(
      input.guardianId,
      input.userId,
    )
    if (!guardian) return left(new GuardianNotFound(input.guardianId))

    const result = guardian.moveTo(input.address)
    if (result.isLeft()) return left(result.value)

    await this.guardians.changeAddress(result.value)

    return right(result.value)
  }
}
