import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class VaccinationVisitWithoutVaccine extends DomainError {
  readonly code = 'VACCINATION_VISIT_WITHOUT_VACCINE'
  readonly type = 'invalid'

  constructor() {
    super('A vaccination visit needs at least one vaccine to finish')
  }
}
