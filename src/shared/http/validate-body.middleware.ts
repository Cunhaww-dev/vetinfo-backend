import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

// Valida o corpo e para aqui com 400 se estiver malformado.
// Genérico de propósito, todo módulo novo reusa este middleware com o schema dele.

export function validateBody(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid request body',
        issues: result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });

      return;
    }

    // Segue com o dado já normalizado pelo Zod (trim aplicado, campos extras removidos).
    req.body = result.data;

    next();
  };
}
