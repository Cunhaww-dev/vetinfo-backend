import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class CpfAlreadyInUse extends DomainError {
  readonly code = 'CPF_ALREADY_IN_USE'
  readonly type = 'conflict'

  constructor(cpf: string) {
    super(`CPF ${cpf} is already in use by another guardian`)
  }
}
