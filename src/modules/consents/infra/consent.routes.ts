import { Router } from 'express'
import { ensureAuthenticated } from '../../../shared/http/ensure-authenticated.middleware.ts'
import { validateBody } from '../../../shared/http/validate-body.middleware.ts'
import { prisma } from '../../../shared/prisma/client.ts'
import { ListConsents } from '../application/list-consents.usecase.ts'
import { RegisterConsent } from '../application/register-consent.usecase.ts'
import { RevokeConsent } from '../application/revoke-consent.usecase.ts'
import { registerConsentSchema } from '../consent.schema.ts'
import { ConsentController } from './consent.controller.ts'
import { PrismaConsentRepository } from './prisma-consent.repository.ts'

const consentRepository = new PrismaConsentRepository(prisma)

const controller = new ConsentController(
  new RegisterConsent(consentRepository),
  new ListConsents(consentRepository),
  new RevokeConsent(consentRepository),
)

export const consentRouter = Router()

consentRouter.post(
  '/patients/:patientId/consents',
  ensureAuthenticated,
  validateBody(registerConsentSchema),
  controller.register,
)
consentRouter.get(
  '/patients/:patientId/consents',
  ensureAuthenticated,
  controller.list,
)
consentRouter.post(
  '/consents/:consentId/revoke',
  ensureAuthenticated,
  controller.revoke,
)
