import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { ShareNotFound } from '../domain/errors/share-not-found.ts'
import type { Share } from '../domain/share-entity.ts'
import type { ShareRepository, ShareUse } from '../domain/share-repository.ts'

type GetShareInput = { userId: string; shareId: string }

// O detalhe traz a lista de usos: é a auditoria de quem acessou e quando
export class GetShare {
  constructor(private readonly shares: ShareRepository) {}

  async execute(
    input: GetShareInput,
  ): Promise<Either<DomainError, { share: Share; uses: ShareUse[] }>> {
    const share = await this.shares.findById(input.shareId, input.userId)
    if (!share) return left(new ShareNotFound(input.shareId))

    return right({ share, uses: await this.shares.listUses(share.id) })
  }
}
