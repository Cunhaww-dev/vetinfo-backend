import type { Visit } from './visit-entity.ts'

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
}
