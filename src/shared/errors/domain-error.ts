export abstract class DomainError { // Abstract para não criarmos u erro genérico a partir dela, impossível realizar um new DomainError('mensagem de erro') diretamente, apenas extendendo ela
  abstract readonly code: string;
  constructor(readonly message: string) {} // Garante que todo erro de domínio tenha uma message
}
