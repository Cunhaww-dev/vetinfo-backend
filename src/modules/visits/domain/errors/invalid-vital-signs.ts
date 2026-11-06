import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class InvalidVitalSigns extends DomainError {
  readonly code = 'INVALID_VITAL_SIGNS'
  readonly type = 'invalid'

  constructor(field: string, value: number) {
    super(`Vital sign ${field} ${value} is out of range`)
  }
}
