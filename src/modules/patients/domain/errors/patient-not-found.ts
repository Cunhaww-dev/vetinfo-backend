import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class PatientNotFound extends DomainError {
  readonly code = 'PATIENT_NOT_FOUND'
  readonly type = 'not_found'

  constructor(id: string) {
    super(`Patient ${id} not found`)
  }
}
