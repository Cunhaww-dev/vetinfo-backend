import { Router } from 'express'
import { ensureAuthenticated } from '../../../shared/http/ensure-authenticated.middleware.ts'
import { validateBody } from '../../../shared/http/validate-body.middleware.ts'
import { prisma } from '../../../shared/prisma/client.ts'
import { ListPatientMedications } from '../application/list-patient-medications.usecase.ts'
import { ListVisitMedications } from '../application/list-visit-medications.usecase.ts'
import { RegisterMedication } from '../application/register-medication.usecase.ts'
import { UpdateMedication } from '../application/update-medication.usecase.ts'
import {
  registerMedicationSchema,
  updateMedicationSchema,
} from '../medication.schema.ts'
import { MedicationController } from './medication.controller.ts'
import { PrismaMedicationRepository } from './prisma-medication.repository.ts'

const medicationRepository = new PrismaMedicationRepository(prisma)

const controller = new MedicationController(
  new RegisterMedication(medicationRepository),
  new ListVisitMedications(medicationRepository),
  new ListPatientMedications(medicationRepository),
  new UpdateMedication(medicationRepository),
)

export const medicationRouter = Router()

medicationRouter.post(
  '/visits/:visitId/medications',
  ensureAuthenticated,
  validateBody(registerMedicationSchema),
  controller.register,
)
medicationRouter.get(
  '/visits/:visitId/medications',
  ensureAuthenticated,
  controller.listByVisit,
)
medicationRouter.get(
  '/patients/:patientId/medications',
  ensureAuthenticated,
  controller.listByPatient,
)
medicationRouter.patch(
  '/medications/:medicationId',
  ensureAuthenticated,
  validateBody(updateMedicationSchema),
  controller.update,
)
