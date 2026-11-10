import { DomainError } from '../../../../shared/errors/domain-error.ts'

export class InvalidCpf extends DomainError {
  readonly code = 'INVALID_CPF'
  readonly type = 'invalid'

  constructor(cpf: string) {
    super(`CPF ${cpf} is invalid`)
  }
}
