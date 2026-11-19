import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import type { GuardianConsent } from '../domain/consent-entity.ts'
import type { ConsentRepository } from '../domain/consent-repository.ts'
import { ConsentNotFound } from '../domain/errors/consent-not-found.ts'

type RevokeConsentInput = {
  userId: string
  consentId: string
}

export class RevokeConsent {
  constructor(private readonly consents: ConsentRepository) {}

  async execute(
    input: RevokeConsentInput,
  ): Promise<Either<DomainError, GuardianConsent>> {
    const consent = await this.consents.findById(input.consentId, input.userId)
    if (!consent) return left(new ConsentNotFound(input.consentId))

    const result = consent.revoke()
    if (result.isLeft()) return left(result.value)

    await this.consents.update(result.value)

    return right(result.value)
  }
}
