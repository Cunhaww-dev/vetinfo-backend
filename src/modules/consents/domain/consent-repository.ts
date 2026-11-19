import type { GuardianConsent } from './consent-entity.ts'

// Só o que o consentimento precisa saber do paciente
export type ConsentPatient = { id: string; guardianId: string | null }

// Toda busca recebe o userId. Um usuário nunca enxerga o consentimento de outro.
export interface ConsentRepository {
  create(consent: GuardianConsent): Promise<void>
  update(consent: GuardianConsent): Promise<void>
  findById(id: string, userId: string): Promise<GuardianConsent | null>
  listByPatient(patientId: string, userId: string): Promise<GuardianConsent[]>
  findActive(
    patientId: string,
    guardianId: string,
  ): Promise<GuardianConsent | null>
  findPatient(patientId: string, userId: string): Promise<ConsentPatient | null>
}
