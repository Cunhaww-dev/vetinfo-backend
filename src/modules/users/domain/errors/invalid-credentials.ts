import { DomainError } from '../../../../shared/errors/domain-error.ts';

export class InvalidCredentials extends DomainError {
  readonly code = 'INVALID_CREDENTIALS';

  constructor() {
    super('Invalid credentials');
  }
}
