import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class GuardianHasPatients extends DomainError {
  readonly code = 'GUARDIAN_HAS_PATIENTS'
  readonly type = 'conflict'

  constructor(count: number) {
    super(
      `The guardian still has ${count} patient(s). Delete them or change their guardian first`,
    )
  }
}
