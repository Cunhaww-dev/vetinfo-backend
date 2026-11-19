import type { Medication } from './medication-entity.ts'

// Só o que a medicação precisa saber do atendimento
export type MedicationVisit = { id: string; visitedAt: Date }

// Toda busca recebe o userId. Um usuário nunca enxerga a medicação de outro.
export interface MedicationRepository {
  create(medication: Medication): Promise<void>
  update(medication: Medication): Promise<void>
  findById(id: string, userId: string): Promise<Medication | null>
  listByVisit(visitId: string, userId: string): Promise<Medication[]>
  listByPatient(patientId: string, userId: string): Promise<Medication[]>
  findVisit(visitId: string, userId: string): Promise<MedicationVisit | null>
  patientExists(patientId: string, userId: string): Promise<boolean>
}
