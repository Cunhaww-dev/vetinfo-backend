import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { GuardianNotFound } from '../../guardians/domain/errors/guardian-not-found.ts'
import { BreedNotFound } from '../domain/errors/breed-not-found.ts'
import { MicrochipAlreadyInUse } from '../domain/errors/microchip-already-in-use.ts'
import { PatientNotFound } from '../domain/errors/patient-not-found.ts'
import type {
  Patient,
  UpdatePatientInput as PatientChanges,
} from '../domain/patient-entity.ts'
import type { PatientRepository } from '../domain/patient-repository.ts'

// A rota manda o breedId. O use case troca pela raça do catálogo.
type UpdatePatientInput = Omit<PatientChanges, 'breed'> & {
  breedId?: string | undefined
  userId: string
  patientId: string
}

export class UpdatePatient {
  constructor(private readonly patients: PatientRepository) {}

  async execute(
    input: UpdatePatientInput,
  ): Promise<Either<DomainError, Patient>> {
    const { userId, patientId, breedId, ...changes } = input

    const patient = await this.patients.findById(patientId, userId)
    if (!patient) return left(new PatientNotFound(patientId))

    const breed = breedId ? await this.patients.findBreed(breedId) : undefined
    if (breedId && !breed) return left(new BreedNotFound(breedId))

    if (
      changes.guardianId &&
      !(await this.patients.guardianExists(changes.guardianId, userId))
    )
      return left(new GuardianNotFound(changes.guardianId))

    const result = patient.update({ ...changes, breed: breed ?? undefined })
    if (result.isLeft()) return left(result.value)

    const { microchip } = result.value
    if (
      microchip &&
      (await this.patients.microchipInUse(microchip, userId, patientId))
    )
      return left(new MicrochipAlreadyInUse(microchip))

    await this.patients.update(result.value)

    return right(result.value)
  }
}
