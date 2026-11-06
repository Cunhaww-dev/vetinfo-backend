import { Router } from 'express'
import swaggerUi from 'swagger-ui-express'
import { openApiDocument } from './openapi-document.ts'

export const docsRouter = Router()

// O JSON cru serve para o front gerar os tipos (ex.: openapi-typescript)
docsRouter.get('/docs/openapi.json', (_req, res) => {
  res.json(openApiDocument)
})

docsRouter.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument))
