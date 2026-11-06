// O tipo diz que espécie de erro é, sem falar de HTTP. Quem traduz o tipo em status é o error handler, na infra.
export type DomainErrorType = 'invalid' | 'not_found' | 'conflict'

export abstract class DomainError {
  // Abstract para não criarmos um erro genérico a partir dela, impossível realizar um new DomainError('mensagem de erro') diretamente, apenas estendendo ela
  abstract readonly code: string
  abstract readonly type: DomainErrorType
  constructor(readonly message: string) {} // Garante que todo erro de domínio tenha uma message
}
