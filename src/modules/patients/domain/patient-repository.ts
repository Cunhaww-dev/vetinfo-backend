import type { Patient } from './patient-entity.ts'

type ListPatientsFilters = {
  guardianId?: string | undefined
}

// Toda busca de paciente ou tutor recebe o userId. Um usuário nunca enxerga o dado de outro.
export interface PatientRepository {
  create(patient: Patient): Promise<void>
  update(patient: Patient): Promise<void>
  findById(id: string, userId: string): Promise<Patient | null>
  listByUser(userId: string, filters: ListPatientsFilters): Promise<Patient[]>
  breedExists(breedId: string): Promise<boolean>
  guardianExists(guardianId: string, userId: string): Promise<boolean>
  // exceptId: na edição, o próprio paciente não conta
  microchipInUse(
    microchip: string,
    userId: string,
    exceptId?: string,
  ): Promise<boolean>
}
