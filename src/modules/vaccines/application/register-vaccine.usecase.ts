import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { PatientNotFound } from '../../patients/domain/errors/patient-not-found.ts'
import { VisitNotFound } from '../../visits/domain/errors/visit-not-found.ts'
import { Vaccine } from '../domain/vaccine-entity.ts'
import type { VaccineRepository } from '../domain/vaccine-repository.ts'

type RegisterVaccineInput = {
  userId: string
  patientId: string
  visitId?: string | null | undefined
  name: string
  appliedAt?: Date | undefined
  nextDoseAt?: Date | null | undefined
  manufacturer?: string | null | undefined
  batch?: string | null | undefined
  notes?: string | null | undefined
}

const toDay = (date: Date) => new Date(date.toISOString().slice(0, 10))

export class RegisterVaccine {
  constructor(private readonly vaccines: VaccineRepository) {}

  async execute(
    input: RegisterVaccineInput,
  ): Promise<Either<DomainError, Vaccine>> {
    const patient = await this.vaccines.findPatient(
      input.patientId,
      input.userId,
    )
    if (!patient) return left(new PatientNotFound(input.patientId))

    // O atendimento precisa ser do mesmo paciente. De outro paciente = não existe
    let visitedAt: Date | null = null
    if (input.visitId) {
      const visit = await this.vaccines.findVisit(input.visitId, input.userId)
      if (!visit || visit.patientId !== patient.id)
        return left(new VisitNotFound(input.visitId))
      visitedAt = visit.visitedAt
    }

    // Sem data, vale o dia do atendimento. Sem atendimento, vale hoje
    const appliedAt = input.appliedAt ?? toDay(visitedAt ?? new Date())

    const result = Vaccine.create({
      ...input,
      appliedAt,
      patientBirthDate: patient.birthDate,
    })
    if (result.isLeft()) return left(result.value)

    await this.vaccines.create(result.value)

    return right(result.value)
  }
}
