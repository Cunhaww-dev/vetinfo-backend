import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class VaccineInFinishedVisit extends DomainError {
  readonly code = 'VACCINE_IN_FINISHED_VISIT'
  readonly type = 'conflict'

  constructor() {
    super('A vaccine of a finished visit cannot be deleted')
  }
}
