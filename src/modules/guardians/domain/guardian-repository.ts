import type { Guardian } from './guardian-entity.ts'

// Toda busca recebe o userId. Um usuário nunca enxerga o tutor de outro.
export interface GuardianRepository {
  create(guardian: Guardian): Promise<void>
  findById(id: string, userId: string): Promise<Guardian | null>
  findByCpf(cpf: string, userId: string): Promise<Guardian | null>
  listByUser(userId: string): Promise<Guardian[]>
  update(guardian: Guardian): Promise<void>
  changeAddress(guardian: Guardian): Promise<void>
}
