import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class VaccinationVisitHasNoSoap extends DomainError {
  readonly code = 'VACCINATION_VISIT_HAS_NO_SOAP'
  readonly type = 'invalid'

  constructor() {
    super('A vaccination visit has no SOAP')
  }
}
