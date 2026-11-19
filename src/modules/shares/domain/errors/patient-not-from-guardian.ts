import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class PatientNotFromGuardian extends DomainError {
  readonly code = 'PATIENT_NOT_FROM_GUARDIAN'
  readonly type = 'invalid'

  constructor(patientId: string) {
    super(`Patient ${patientId} does not belong to this guardian`)
  }
}
