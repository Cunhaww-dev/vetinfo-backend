import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { PatientNotFound } from '../../patients/domain/errors/patient-not-found.ts'
import type { Visit } from '../domain/visit-entity.ts'
import type { VisitRepository } from '../domain/visit-repository.ts'

type GetLatestVitalSignsInput = {
  userId: string
  patientId: string
}

// A sugestão do Plano: o front preenche o novo atendimento com os últimos sinais vitais.
// null = o paciente ainda não tem nenhum sinal vital registrado.
export class GetLatestVitalSigns {
  constructor(private readonly visits: VisitRepository) {}

  async execute(
    input: GetLatestVitalSignsInput,
  ): Promise<Either<DomainError, Visit | null>> {
    if (!(await this.visits.patientExists(input.patientId, input.userId)))
      return left(new PatientNotFound(input.patientId))

    return right(
      await this.visits.findLatestWithVitalSigns(input.patientId, input.userId),
    )
  }
}
