import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { PatientNotFound } from '../../patients/domain/errors/patient-not-found.ts'
import type { Attachment } from '../domain/attachment-entity.ts'
import type { AttachmentRepository } from '../domain/attachment-repository.ts'

type ListPatientAttachmentsInput = {
  userId: string
  patientId: string
}

// Todos os anexos de todos os atendimentos do paciente
export class ListPatientAttachments {
  constructor(private readonly attachments: AttachmentRepository) {}

  async execute(
    input: ListPatientAttachmentsInput,
  ): Promise<Either<DomainError, Attachment[]>> {
    if (!(await this.attachments.patientExists(input.patientId, input.userId)))
      return left(new PatientNotFound(input.patientId))

    return right(
      await this.attachments.listByPatient(input.patientId, input.userId),
    )
  }
}
