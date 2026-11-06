import type { Guardian } from '../domain/guardian-entity.ts'
import type { GuardianRepository } from '../domain/guardian-repository.ts'

type ListGuardiansInput = {
  userId: string
}

export class ListGuardians {
  constructor(private readonly guardians: GuardianRepository) {}

  async execute(input: ListGuardiansInput): Promise<Guardian[]> {
    return this.guardians.listByUser(input.userId)
  }
}
