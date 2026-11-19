import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import type { FileStorage } from '../../../shared/storage/file-storage.ts'
import { detectFileType } from '../../../shared/storage/file-type.ts'
import { PatientNotFound } from '../domain/errors/patient-not-found.ts'
import { PhotoNotFound } from '../domain/errors/photo-not-found.ts'
import type { PatientRepository } from '../domain/patient-repository.ts'

type GetPatientPhotoInput = {
  userId: string
  patientId: string
}

type Photo = { content: Buffer; contentType: string }

export class GetPatientPhoto {
  constructor(
    private readonly patients: PatientRepository,
    private readonly storage: FileStorage,
  ) {}

  async execute(
    input: GetPatientPhotoInput,
  ): Promise<Either<DomainError, Photo>> {
    const patient = await this.patients.findById(input.patientId, input.userId)
    if (!patient) return left(new PatientNotFound(input.patientId))
    if (!patient.photoKey) return left(new PhotoNotFound(patient.id))

    const content = await this.storage.read(patient.photoKey)
    // A foto foi conferida no envio. Aqui o tipo só vira o Content-Type
    const contentType = detectFileType(content) ?? 'application/octet-stream'

    return right({ content, contentType })
  }
}
