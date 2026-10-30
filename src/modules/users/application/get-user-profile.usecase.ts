import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { UserNotFound } from '../domain/errors/user-not-found.ts'
import type { User } from '../domain/user-entity.ts'
import type { UserRepository } from '../domain/user-repository.ts'

type GetUserProfileInput = {
  userId: string
}

export class GetUserProfile {
  constructor(private readonly users: UserRepository) {}

  async execute(
    input: GetUserProfileInput,
  ): Promise<Either<DomainError, User>> {
    const user = await this.users.findById(input.userId)
    if (!user) return left(new UserNotFound(input.userId))

    return right(user)
  }
}
