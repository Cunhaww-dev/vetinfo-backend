import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { PatientNotFound } from '../../patients/domain/errors/patient-not-found.ts'
import type { GuardianConsent } from '../domain/consent-entity.ts'
import type { ConsentRepository } from '../domain/consent-repository.ts'

type ListConsentsInput = {
  userId: string
  patientId: string
}

// O histórico inteiro, com os revogados: é a rastreabilidade do consentimento
export class ListConsents {
  constructor(private readonly consents: ConsentRepository) {}

  async execute(
    input: ListConsentsInput,
  ): Promise<Either<DomainError, GuardianConsent[]>> {
    if (!(await this.consents.findPatient(input.patientId, input.userId)))
      return left(new PatientNotFound(input.patientId))

    return right(
      await this.consents.listByPatient(input.patientId, input.userId),
    )
  }
}
