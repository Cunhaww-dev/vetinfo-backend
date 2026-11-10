import type { Visit } from './visit-entity.ts'

// Só leitura, para a lista "atendidos há pouco". Não é uma entidade.
export type RecentPatient = {
  visitId: string
  visitedAt: Date
  patient: { id: string; name: string; breedId: string }
}

// Toda busca recebe o userId. Um usuário nunca enxerga o atendimento de outro.
export interface VisitRepository {
  create(visit: Visit): Promise<void>
  update(visit: Visit): Promise<void>
  findById(id: string, userId: string): Promise<Visit | null>
  listByPatient(patientId: string, userId: string): Promise<Visit[]>
  findLatestWithVitalSigns(
    patientId: string,
    userId: string,
  ): Promise<Visit | null>
  patientExists(patientId: string, userId: string): Promise<boolean>
  listRecentPatients(userId: string, limit: number): Promise<RecentPatient[]>
}
