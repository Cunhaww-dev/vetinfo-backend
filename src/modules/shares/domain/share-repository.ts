import type { Share } from './share-entity.ts'

// Só o que o compartilhamento precisa saber do paciente
export type SharePatient = { id: string; guardianId: string | null }

export type ShareVisitor = {
  ipAddress: string | null
  userAgent: string | null
}
export type ShareUse = ShareVisitor & { usedAt: Date }

export interface ShareRepository {
  create(share: Share): Promise<void>
  update(share: Share): Promise<void>
  // Do veterinário: sempre com o userId
  findById(id: string, userId: string): Promise<Share | null>
  listByUser(userId: string): Promise<Share[]>
  listUses(shareId: string): Promise<ShareUse[]>
  // Da rota pública: o código é a chave, sem userId
  findByCode(code: string): Promise<Share | null>
  codeExists(code: string): Promise<boolean>
  recordUse(shareId: string, visitor: ShareVisitor): Promise<void>
  // Para conferir as regras de quem pode receber
  findPatients(ids: string[], userId: string): Promise<SharePatient[]>
  guardianExists(guardianId: string, userId: string): Promise<boolean>
  // Os pacientes com consentimento ativo do tutor atual
  withActiveConsent(patients: SharePatient[]): Promise<Set<string>>
}
