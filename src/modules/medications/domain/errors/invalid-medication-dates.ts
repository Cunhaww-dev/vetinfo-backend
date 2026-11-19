import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class InvalidMedicationDates extends DomainError {
  readonly code = 'INVALID_MEDICATION_DATES'
  readonly type = 'invalid'

  constructor() {
    super('Medication end date cannot be before the start date')
  }
}
