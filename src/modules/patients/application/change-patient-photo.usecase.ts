import { randomUUID } from 'node:crypto'
import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import type { FileStorage } from '../../../shared/storage/file-storage.ts'
import { detectFileType } from '../../../shared/storage/file-type.ts'
import { InvalidPhotoType } from '../domain/errors/invalid-photo-type.ts'
import { PatientNotFound } from '../domain/errors/patient-not-found.ts'
import type { Patient } from '../domain/patient-entity.ts'
import type { PatientRepository } from '../domain/patient-repository.ts'

type ChangePatientPhotoInput = {
  userId: string
  patientId: string
  content: Buffer
}

export class ChangePatientPhoto {
  constructor(
    private readonly patients: PatientRepository,
    private readonly storage: FileStorage,
  ) {}

  async execute(
    input: ChangePatientPhotoInput,
  ): Promise<Either<DomainError, Patient>> {
    const patient = await this.patients.findById(input.patientId, input.userId)
    if (!patient) return left(new PatientNotFound(input.patientId))

    const contentType = detectFileType(input.content)
    if (!contentType || contentType === 'application/pdf')
      return left(new InvalidPhotoType())

    // Chave nova a cada troca: o navegador não mostra a foto antiga do cache
    const photoKey = `patients/${input.userId}/${patient.id}-${randomUUID()}`
    await this.storage.save(photoKey, input.content, contentType)

    const updated = patient.changePhoto(photoKey)
    await this.patients.update(updated)

    // A foto antiga só sai depois que o banco aponta para a nova
    if (patient.photoKey) await this.storage.remove(patient.photoKey)

    return right(updated)
  }
}
