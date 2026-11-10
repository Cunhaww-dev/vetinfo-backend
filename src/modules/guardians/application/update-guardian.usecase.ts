import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { CpfAlreadyInUse } from '../domain/errors/cpf-already-in-use.ts'
import { GuardianNotFound } from '../domain/errors/guardian-not-found.ts'
import type { Guardian } from '../domain/guardian-entity.ts'
import type { GuardianRepository } from '../domain/guardian-repository.ts'

type UpdateGuardianInput = {
  userId: string
  guardianId: string
  name?: string | undefined
  phone?: string | undefined
  email?: string | undefined
  cpf?: string | null | undefined
  birthDate?: Date | undefined
}

export class UpdateGuardian {
  constructor(private readonly guardians: GuardianRepository) {}

  async execute(
    input: UpdateGuardianInput,
  ): Promise<Either<DomainError, Guardian>> {
    const guardian = await this.guardians.findById(
      input.guardianId,
      input.userId,
    )
    if (!guardian) return left(new GuardianNotFound(input.guardianId))

    const result = guardian.update({
      name: input.name,
      phone: input.phone,
      email: input.email,
      cpf: input.cpf,
      birthDate: input.birthDate,
    })
    if (result.isLeft()) return left(result.value)

    const updated = result.value

    // O CPF pode ser o do próprio tutor. Só é conflito se for de outro tutor.
    if (updated.cpf) {
      const existing = await this.guardians.findByCpf(
        updated.cpf.value,
        input.userId,
      )
      if (existing && existing.id !== updated.id)
        return left(new CpfAlreadyInUse(updated.cpf.value))
    }

    await this.guardians.update(updated)

    return right(updated)
  }
}
