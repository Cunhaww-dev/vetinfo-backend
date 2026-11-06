import { Router } from 'express'
import { ensureAuthenticated } from '../../../shared/http/ensure-authenticated.middleware.ts'
import { validateBody } from '../../../shared/http/validate-body.middleware.ts'
import { prisma } from '../../../shared/prisma/client.ts'
import { ChangeGuardianAddress } from '../application/change-guardian-address.usecase.ts'
import { CreateGuardian } from '../application/create-guardian.usecase.ts'
import { GetGuardian } from '../application/get-guardian.usecase.ts'
import { ListGuardians } from '../application/list-guardians.usecase.ts'
import { UpdateGuardian } from '../application/update-guardian.usecase.ts'
import {
  addressSchema,
  createGuardianSchema,
  updateGuardianSchema,
} from '../guardian.schema.ts'
import { GuardianController } from './guardian.controller.ts'
import { PrismaGuardianRepository } from './prisma-guardian.repository.ts'

const guardianRepository = new PrismaGuardianRepository(prisma)

const controller = new GuardianController(
  new CreateGuardian(guardianRepository),
  new ListGuardians(guardianRepository),
  new GetGuardian(guardianRepository),
  new UpdateGuardian(guardianRepository),
  new ChangeGuardianAddress(guardianRepository),
)

export const guardianRouter = Router()

// Todas as rotas de tutor pedem login
guardianRouter.use('/guardians', ensureAuthenticated)

guardianRouter.post(
  '/guardians',
  validateBody(createGuardianSchema),
  controller.create,
)
guardianRouter.get('/guardians', controller.list)
guardianRouter.get('/guardians/:guardianId', controller.show)
guardianRouter.patch(
  '/guardians/:guardianId',
  validateBody(updateGuardianSchema),
  controller.update,
)
guardianRouter.put(
  '/guardians/:guardianId/address',
  validateBody(addressSchema),
  controller.changeAddress,
)
