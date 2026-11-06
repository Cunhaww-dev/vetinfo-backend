// Cria a instancia do express
import express from 'express'
import { healthRouter } from './shared/http/health.routes.ts'
import { userRouter } from './modules/users/infra/user.routes.ts'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './shared/auth/auth.ts'
import { catalogRouter } from './modules/catalog/infra/catalog.routes.ts'

const app = express()
app.all('/api/auth/*splat', toNodeHandler(auth))
app.use(express.json())
app.use(healthRouter)
app.use(userRouter)
app.use(catalogRouter)

export { app }
