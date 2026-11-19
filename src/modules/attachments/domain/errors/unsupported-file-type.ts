import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class UnsupportedFileType extends DomainError {
  readonly code = 'UNSUPPORTED_FILE_TYPE'
  readonly type = 'invalid'

  constructor() {
    super('Only PDF, JPEG, PNG and WEBP files are accepted')
  }
}
