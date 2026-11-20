import { Router } from 'express'
import { ensureAuthenticated } from '../../../shared/http/ensure-authenticated.middleware.ts'
import { validateBody } from '../../../shared/http/validate-body.middleware.ts'
import { prisma } from '../../../shared/prisma/client.ts'
import { ListDueVaccines } from '../application/list-due-vaccines.usecase.ts'
import { ListPatientVaccines } from '../application/list-patient-vaccines.usecase.ts'
import { ListVisitVaccines } from '../application/list-visit-vaccines.usecase.ts'
import { RegisterVaccine } from '../application/register-vaccine.usecase.ts'
import { UpdateVaccine } from '../application/update-vaccine.usecase.ts'
import {
  registerVaccineSchema,
  updateVaccineSchema,
} from '../vaccine.schema.ts'
import { PrismaVaccineRepository } from './prisma-vaccine.repository.ts'
import { VaccineController } from './vaccine.controller.ts'
import { DeleteVaccine } from '../application/delete-vaccine.usecase.ts'

const vaccineRepository = new PrismaVaccineRepository(prisma)

const controller = new VaccineController(
  new RegisterVaccine(vaccineRepository),
  new ListPatientVaccines(vaccineRepository),
  new ListVisitVaccines(vaccineRepository),
  new UpdateVaccine(vaccineRepository),
  new ListDueVaccines(vaccineRepository),
  new DeleteVaccine(vaccineRepository),
)

export const vaccineRouter = Router()

vaccineRouter.post(
  '/patients/:patientId/vaccines',
  ensureAuthenticated,
  validateBody(registerVaccineSchema),
  controller.register,
)
vaccineRouter.get(
  '/patients/:patientId/vaccines',
  ensureAuthenticated,
  controller.listByPatient,
)
vaccineRouter.get(
  '/visits/:visitId/vaccines',
  ensureAuthenticated,
  controller.listByVisit,
)
vaccineRouter.get('/vaccines/due', ensureAuthenticated, controller.due)
vaccineRouter.patch(
  '/vaccines/:vaccineId',
  ensureAuthenticated,
  validateBody(updateVaccineSchema),
  controller.update,
)
vaccineRouter.delete(
  '/vaccines/:vaccineId',
  ensureAuthenticated,
  controller.remove,
)
