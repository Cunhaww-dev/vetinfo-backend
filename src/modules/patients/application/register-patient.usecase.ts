import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { GuardianNotFound } from '../../guardians/domain/errors/guardian-not-found.ts'
import { BreedNotFound } from '../domain/errors/breed-not-found.ts'
import { Patient, type PatientSex } from '../domain/patient-entity.ts'
import type { PatientRepository } from '../domain/patient-repository.ts'

type RegisterPatientInput = {
  userId: string
  guardianId?: string | null | undefined
  breedId: string
  name: string
  sex: PatientSex
  neutered?: boolean | undefined
  coatColor?: string | null | undefined
  birthDate: Date
  microchip?: string | null | undefined
}

export class RegisterPatient {
  constructor(private readonly patients: PatientRepository) {}

  async execute(
    input: RegisterPatientInput,
  ): Promise<Either<DomainError, Patient>> {
    if (!(await this.patients.breedExists(input.breedId)))
      return left(new BreedNotFound(input.breedId))

    // O tutor precisa ser do mesmo usuário. Tutor de outro usuário = não existe
    if (
      input.guardianId &&
      !(await this.patients.guardianExists(input.guardianId, input.userId))
    )
      return left(new GuardianNotFound(input.guardianId))

    const result = Patient.create(input)
    if (result.isLeft()) return left(result.value)

    await this.patients.create(result.value)

    return right(result.value)
  }
}
