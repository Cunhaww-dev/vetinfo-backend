import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { PatientNotFound } from '../../patients/domain/errors/patient-not-found.ts'
import { UserNotFound } from '../../users/domain/errors/user-not-found.ts'
import type { UserRepository } from '../../users/domain/user-repository.ts'
import type { SoapInput } from '../domain/soap.ts'
import { Visit } from '../domain/visit-entity.ts'
import type { VisitRepository } from '../domain/visit-repository.ts'
import type { VitalSignsInput } from '../domain/vital-signs.ts'

type RegisterVisitInput = {
  userId: string
  patientId: string
  visitedAt?: Date | undefined
  vitalSigns?: VitalSignsInput | undefined
  soap?: SoapInput | undefined
}

export class RegisterVisit {
  constructor(
    private readonly visits: VisitRepository,
    private readonly users: UserRepository,
  ) {}

  async execute(
    input: RegisterVisitInput,
  ): Promise<Either<DomainError, Visit>> {
    if (!(await this.visits.patientExists(input.patientId, input.userId)))
      return left(new PatientNotFound(input.patientId))

    // O snapshot: lê o tipo do autor no banco, agora, e copia para o atendimento.
    // Se o estudante virar profissional amanhã, este atendimento continua "student".
    const author = await this.users.findById(input.userId)
    if (!author) return left(new UserNotFound(input.userId))

    const result = Visit.create({ ...input, authorType: author.type })
    if (result.isLeft()) return left(result.value)

    await this.visits.create(result.value)

    return right(result.value)
  }
}
