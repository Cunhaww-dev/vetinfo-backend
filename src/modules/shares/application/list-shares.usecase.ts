import type { Share } from '../domain/share-entity.ts'
import type { ShareRepository } from '../domain/share-repository.ts'

type ListSharesInput = { userId: string }

export class ListShares {
  constructor(private readonly shares: ShareRepository) {}

  async execute(input: ListSharesInput): Promise<Share[]> {
    return this.shares.listByUser(input.userId)
  }
}
