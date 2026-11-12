import type { Visit } from './visit-entity.ts'

// Só leitura, para a lista "atendidos há pouco". Não é uma entidade.
export type RecentPatient = {
  visitId: string
  visitedAt: Date
  patient: { id: string; name: string; breedId: string }
}

// Só o que o atendimento precisa saber do paciente
export type VisitPatient = { birthDate: Date | null }

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
  findPatient(patientId: string, userId: string): Promise<VisitPatient | null>
  listRecentPatients(userId: string, limit: number): Promise<RecentPatient[]>
}
