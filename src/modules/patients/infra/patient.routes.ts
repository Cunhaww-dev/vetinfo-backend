import { Router } from 'express'
import { ensureAuthenticated } from '../../../shared/http/ensure-authenticated.middleware.ts'
import { validateBody } from '../../../shared/http/validate-body.middleware.ts'
import { prisma } from '../../../shared/prisma/client.ts'
import { GetPatient } from '../application/get-patient.usecase.ts'
import { ListPatients } from '../application/list-patients.usecase.ts'
import { RegisterPatient } from '../application/register-patient.usecase.ts'
import { UpdatePatient } from '../application/update-patient.usecase.ts'
import {
  registerPatientSchema,
  updatePatientSchema,
} from '../patient.schema.ts'
import { PatientController } from './patient.controller.ts'
import { PrismaPatientRepository } from './prisma-patient.repository.ts'

const patientRepository = new PrismaPatientRepository(prisma)

const controller = new PatientController(
  new RegisterPatient(patientRepository),
  new ListPatients(patientRepository),
  new GetPatient(patientRepository),
  new UpdatePatient(patientRepository),
)

export const patientRouter = Router()

// Todas as rotas de paciente pedem login
patientRouter.use('/patients', ensureAuthenticated)

patientRouter.post(
  '/patients',
  validateBody(registerPatientSchema),
  controller.register,
)
patientRouter.get('/patients', controller.list)
patientRouter.get('/patients/:patientId', controller.show)
patientRouter.patch(
  '/patients/:patientId',
  validateBody(updatePatientSchema),
  controller.update,
)
