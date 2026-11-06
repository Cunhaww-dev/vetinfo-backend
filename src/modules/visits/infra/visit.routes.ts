import { Router } from 'express'
import { ensureAuthenticated } from '../../../shared/http/ensure-authenticated.middleware.ts'
import { validateBody } from '../../../shared/http/validate-body.middleware.ts'
import { prisma } from '../../../shared/prisma/client.ts'
import { PrismaUserRepository } from '../../users/infra/prisma-user.repository.ts'
import { GetLatestVitalSigns } from '../application/get-latest-vital-signs.usecase.ts'
import { GetVisit } from '../application/get-visit.usecase.ts'
import { ListVisits } from '../application/list-visits.usecase.ts'
import { RegisterVisit } from '../application/register-visit.usecase.ts'
import { UpdateVisit } from '../application/update-visit.usecase.ts'
import { registerVisitSchema, updateVisitSchema } from '../visit.schema.ts'
import { PrismaVisitRepository } from './prisma-visit.repository.ts'
import { VisitController } from './visit.controller.ts'

const visitRepository = new PrismaVisitRepository(prisma)
const userRepository = new PrismaUserRepository(prisma)

const controller = new VisitController(
  new RegisterVisit(visitRepository, userRepository),
  new ListVisits(visitRepository),
  new GetVisit(visitRepository),
  new UpdateVisit(visitRepository),
  new GetLatestVitalSigns(visitRepository),
)

export const visitRouter = Router()

// Todas as rotas de atendimento pedem login. Algumas começam com /patients,
// por isso o ensureAuthenticated fica em cada rota, e não num use('/visits').
visitRouter.post(
  '/patients/:patientId/visits',
  ensureAuthenticated,
  validateBody(registerVisitSchema),
  controller.register,
)
visitRouter.get(
  '/patients/:patientId/visits',
  ensureAuthenticated,
  controller.list,
)
visitRouter.get(
  '/patients/:patientId/vital-signs/latest',
  ensureAuthenticated,
  controller.latestVitalSigns,
)
visitRouter.get('/visits/:visitId', ensureAuthenticated, controller.show)
visitRouter.patch(
  '/visits/:visitId',
  ensureAuthenticated,
  validateBody(updateVisitSchema),
  controller.update,
)
