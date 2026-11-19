import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import type { FileStorage } from '../../../shared/storage/file-storage.ts'
import { PatientNotFound } from '../domain/errors/patient-not-found.ts'
import type { Patient } from '../domain/patient-entity.ts'
import type { PatientRepository } from '../domain/patient-repository.ts'

type RemovePatientPhotoInput = {
  userId: string
  patientId: string
}

// Sem foto já é o resultado esperado, então remover de novo não dá erro
export class RemovePatientPhoto {
  constructor(
    private readonly patients: PatientRepository,
    private readonly storage: FileStorage,
  ) {}

  async execute(
    input: RemovePatientPhotoInput,
  ): Promise<Either<DomainError, Patient>> {
    const patient = await this.patients.findById(input.patientId, input.userId)
    if (!patient) return left(new PatientNotFound(input.patientId))
    if (!patient.photoKey) return right(patient)

    const updated = patient.changePhoto(null)
    await this.patients.update(updated)
    await this.storage.remove(patient.photoKey)

    return right(updated)
  }
}
