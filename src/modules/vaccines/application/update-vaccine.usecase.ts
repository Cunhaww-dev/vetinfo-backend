import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { PatientNotFound } from '../../patients/domain/errors/patient-not-found.ts'
import { VaccineNotFound } from '../domain/errors/vaccine-not-found.ts'
import type {
  UpdateVaccineInput as VaccineChanges,
  Vaccine,
} from '../domain/vaccine-entity.ts'
import type { VaccineRepository } from '../domain/vaccine-repository.ts'

type UpdateVaccineInput = VaccineChanges & {
  userId: string
  vaccineId: string
}

export class UpdateVaccine {
  constructor(private readonly vaccines: VaccineRepository) {}

  async execute(
    input: UpdateVaccineInput,
  ): Promise<Either<DomainError, Vaccine>> {
    const { userId, vaccineId, ...changes } = input

    const vaccine = await this.vaccines.findById(vaccineId, userId)
    if (!vaccine) return left(new VaccineNotFound(vaccineId))

    // O paciente é do mesmo usuário, porque a vacina é
    const patient = await this.vaccines.findPatient(vaccine.patientId, userId)
    if (!patient) return left(new PatientNotFound(vaccine.patientId))

    const result = vaccine.update(changes, patient.birthDate)
    if (result.isLeft()) return left(result.value)

    await this.vaccines.update(result.value)

    return right(result.value)
  }
}
