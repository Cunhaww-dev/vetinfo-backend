import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class PatientWithoutGuardian extends DomainError {
  readonly code = 'PATIENT_WITHOUT_GUARDIAN'
  readonly type = 'invalid'

  constructor(patientId: string) {
    super(`Patient ${patientId} has no guardian to give consent`)
  }
}
