import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { ShareNotFound } from '../domain/errors/share-not-found.ts'
import type { Share } from '../domain/share-entity.ts'
import type { ShareRepository } from '../domain/share-repository.ts'

type RevokeShareInput = { userId: string; shareId: string }

export class RevokeShare {
  constructor(private readonly shares: ShareRepository) {}

  async execute(input: RevokeShareInput): Promise<Either<DomainError, Share>> {
    const share = await this.shares.findById(input.shareId, input.userId)
    if (!share) return left(new ShareNotFound(input.shareId))

    const result = share.revoke()
    if (result.isLeft()) return left(result.value)

    await this.shares.update(result.value)

    return right(result.value)
  }
}
