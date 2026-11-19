import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class PhotoNotFound extends DomainError {
  readonly code = 'PHOTO_NOT_FOUND'
  readonly type = 'not_found'

  constructor(patientId: string) {
    super(`Patient ${patientId} has no photo`)
  }
}
