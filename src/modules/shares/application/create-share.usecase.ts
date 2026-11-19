import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { GuardianNotFound } from '../../guardians/domain/errors/guardian-not-found.ts'
import { PatientNotFound } from '../../patients/domain/errors/patient-not-found.ts'
import { ConsentRequired } from '../domain/errors/consent-required.ts'
import { PatientNotFromGuardian } from '../domain/errors/patient-not-from-guardian.ts'
import { generateShareCode } from '../domain/share-code.ts'
import { Share, type ShareType } from '../domain/share-entity.ts'
import type { ShareRepository } from '../domain/share-repository.ts'

const DEFAULT_DAYS = 7
const DAY_MS = 24 * 60 * 60 * 1000

type CreateShareInput = {
  userId: string
  type: ShareType
  guardianId?: string | null | undefined
  patientIds: string[]
  recipientName?: string | null | undefined
  expiresAt?: Date | undefined
  maxUses?: number | null | undefined
}

export class CreateShare {
  constructor(private readonly shares: ShareRepository) {}

  async execute(input: CreateShareInput): Promise<Either<DomainError, Share>> {
    const patientIds = [...new Set(input.patientIds)]
    const patients = await this.shares.findPatients(patientIds, input.userId)

    // Paciente de outro usuário = não existe
    const missing = patientIds.find((id) => !patients.some((p) => p.id === id))
    if (missing) return left(new PatientNotFound(missing))

    // Tutor: só os animais dele, e não precisa de consentimento (é o dono)
    if (input.type === 'guardian' && input.guardianId) {
      if (!(await this.shares.guardianExists(input.guardianId, input.userId)))
        return left(new GuardianNotFound(input.guardianId))

      const other = patients.find((p) => p.guardianId !== input.guardianId)
      if (other) return left(new PatientNotFromGuardian(other.id))
    }

    // Terceiro (estudo): todo paciente precisa do consentimento do tutor atual
    if (input.type === 'third_party') {
      const consented = await this.shares.withActiveConsent(patients)
      const without = patients.find((p) => !consented.has(p.id))
      if (without) return left(new ConsentRequired(without.id))
    }

    const result = Share.create({
      ...input,
      patientIds,
      code: await this.uniqueCode(),
      // Sem prazo, o código vale 7 dias
      expiresAt:
        input.expiresAt ?? new Date(Date.now() + DEFAULT_DAYS * DAY_MS),
    })
    if (result.isLeft()) return left(result.value)

    await this.shares.create(result.value)

    return right(result.value)
  }

  // A chance de repetir é mínima, mas o banco tem @unique no código. Melhor conferir.
  private async uniqueCode(): Promise<string> {
    for (;;) {
      const code = generateShareCode()
      if (!(await this.shares.codeExists(code))) return code
    }
  }
}
