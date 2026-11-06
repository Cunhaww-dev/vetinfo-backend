import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { GuardianNotFound } from '../domain/errors/guardian-not-found.ts'
import type { Guardian } from '../domain/guardian-entity.ts'
import type { GuardianRepository } from '../domain/guardian-repository.ts'

type UpdateGuardianInput = {
  userId: string
  guardianId: string
  name?: string | undefined
  phone?: string | null | undefined
  email?: string | null | undefined
}

export class UpdateGuardian {
  constructor(private readonly guardians: GuardianRepository) {}

  async execute(
    input: UpdateGuardianInput,
  ): Promise<Either<DomainError, Guardian>> {
    const guardian = await this.guardians.findById(
      input.guardianId,
      input.userId,
    )
    if (!guardian) return left(new GuardianNotFound(input.guardianId))

    const updated = guardian.update({
      name: input.name,
      phone: input.phone,
      email: input.email,
    })
    await this.guardians.update(updated)

    return right(updated)
  }
}
