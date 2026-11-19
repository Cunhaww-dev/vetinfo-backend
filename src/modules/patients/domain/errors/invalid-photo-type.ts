import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class InvalidPhotoType extends DomainError {
  readonly code = 'INVALID_PHOTO_TYPE'
  readonly type = 'invalid'

  constructor() {
    super('The photo must be a JPEG, PNG or WEBP image')
  }
}
