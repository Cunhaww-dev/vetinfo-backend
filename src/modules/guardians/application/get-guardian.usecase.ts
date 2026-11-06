import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { GuardianNotFound } from '../domain/errors/guardian-not-found.ts'
import type { Guardian } from '../domain/guardian-entity.ts'
import type { GuardianRepository } from '../domain/guardian-repository.ts'

type GetGuardianInput = {
  userId: string
  guardianId: string
}

export class GetGuardian {
  constructor(private readonly guardians: GuardianRepository) {}

  async execute(
    input: GetGuardianInput,
  ): Promise<Either<DomainError, Guardian>> {
    // Tutor de outro usuário também cai aqui: para quem pede, ele não existe
    const guardian = await this.guardians.findById(
      input.guardianId,
      input.userId,
    )
    if (!guardian) return left(new GuardianNotFound(input.guardianId))

    return right(guardian)
  }
}
