// Cria a instancia do express
import express from 'express'
import { healthRouter } from './shared/http/health.routes.ts'
import { userRouter } from './modules/users/infra/user.routes.ts'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './shared/auth/auth.ts'
import { catalogRouter } from './modules/catalog/infra/catalog.routes.ts'
import { guardianRouter } from './modules/guardians/infra/guardian.routes.ts'
import { patientRouter } from './modules/patients/infra/patient.routes.ts'
import { visitRouter } from './modules/visits/infra/visit.routes.ts'
import { errorHandler } from './shared/http/error-handler.middleware.ts'
import { routeNotFound } from './shared/http/route-not-found.middleware.ts'
import { docsRouter } from './shared/docs/docs.routes.ts'

const app = express()
app.all('/api/auth/*splat', toNodeHandler(auth))
app.use(express.json())
app.use(healthRouter)
// Swagger em /docs. Em produção ele não sobe: a doc mostra todas as rotas e os erros
if (process.env.NODE_ENV !== 'production') app.use(docsRouter)
app.use(userRouter)
app.use(catalogRouter)
app.use(guardianRouter)
app.use(visitRouter) // Antes do patientRouter: as rotas /patients/:patientId/visits são dele
app.use(patientRouter)
app.use(routeNotFound) // Nenhuma rota acima respondeu
app.use(errorHandler) // Sempre o último. Pega os erros de todas as rotas acima

export { app }
