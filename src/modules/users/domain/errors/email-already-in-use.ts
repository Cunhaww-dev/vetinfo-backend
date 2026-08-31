import { DomainError } from "../../../../shared/errors/domain-error.ts";

export class EmailAlreadyInUse extends DomainError {
  readonly code = 'EMAIL_ALREADY_IN_USE';

  constructor(email: string) {
    super(`Email ${email} is already in use`);
  }
}
