import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { GuardianHasPatients } from '../domain/errors/guardian-has-patients.ts'
import { GuardianNotFound } from '../domain/errors/guardian-not-found.ts'
import type { GuardianRepository } from '../domain/guardian-repository.ts'

type DeleteGuardianInput = {
  userId: string
  guardianId: string
}

// Soft delete: o tutor some do app, mas fica no banco.
// Tutor com paciente não sai: o vet apaga o paciente ou troca o tutor dele antes.
// Assim, nenhum animal perde o tutor sem o vet ver.
export class DeleteGuardian {
  constructor(private readonly guardians: GuardianRepository) {}

  async execute(
    input: DeleteGuardianInput,
  ): Promise<Either<DomainError, null>> {
    const guardian = await this.guardians.findById(
      input.guardianId,
      input.userId,
    )
    if (!guardian) return left(new GuardianNotFound(input.guardianId))

    const patients = await this.guardians.countPatients(guardian.id)
    if (patients > 0) return left(new GuardianHasPatients(patients))

    await this.guardians.softDelete(guardian.id)
    return right(null)
  }
}
