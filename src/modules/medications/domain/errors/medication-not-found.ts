import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class MedicationNotFound extends DomainError {
  readonly code = 'MEDICATION_NOT_FOUND'
  readonly type = 'not_found'

  constructor(id: string) {
    super(`Medication ${id} not found`)
  }
}
