import type { Request, Response } from 'express'

// Rota que não existe. Sem este middleware, o Express responde em HTML ("Cannot GET /x").
// Fica depois de todas as rotas e antes do errorHandler.
export function routeNotFound(req: Request, res: Response) {
  res.status(404).json({
    code: 'ROUTE_NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
  })
}
