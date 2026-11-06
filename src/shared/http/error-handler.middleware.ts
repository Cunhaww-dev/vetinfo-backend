import type { NextFunction, Request, Response } from 'express'
import { DomainError, type DomainErrorType } from '../errors/domain-error.ts'

// Um mapa só para o projeto todo. Módulo novo não mexe aqui, ele só escolhe o type do erro.
const STATUS_BY_ERROR_TYPE: Record<DomainErrorType, number> = {
  invalid: 422,
  not_found: 404,
  conflict: 409,
}

// O Express só reconhece um middleware de erro quando ele tem os 4 parâmetros, mesmo sem usar o next.
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof DomainError) {
    return res
      .status(STATUS_BY_ERROR_TYPE[error.type])
      .json({ code: error.code, message: error.message })
  }

  // JSON quebrado no body. O express.json() lança esse erro antes de chegar na rota.
  if (error instanceof SyntaxError && 'body' in error) {
    return res
      .status(400)
      .json({
        code: 'INVALID_JSON',
        message: 'Request body is not a valid JSON',
      })
  }

  console.error(error)
  return res
    .status(500)
    .json({ code: 'INTERNAL_ERROR', message: 'Something went wrong' })
}
