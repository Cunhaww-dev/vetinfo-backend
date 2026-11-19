import { z } from 'zod'
import type { ZodOpenApiPathsObject } from 'zod-openapi'
import {
  badRequest,
  error,
  json,
  unauthorized,
  uuid,
} from '../../../shared/docs/responses.ts'
import { MEDICATION_ROUTES } from '../domain/medication-entity.ts'
import {
  patientMedicationsQuerySchema,
  registerMedicationSchema,
  updateMedicationSchema,
} from '../medication.schema.ts'

const medicationSchema = z
  .object({
    id: uuid,
    visitId: uuid,
    name: z.string().meta({ example: 'Amoxicilina' }),
    dosage: z.string().meta({ example: '10 mg/kg' }),
    frequency: z.string().meta({ example: 'A cada 12 horas' }),
    route: z
      .enum(MEDICATION_ROUTES)
      .meta({ description: 'Via de administração' }),
    startDate: z.iso.date().meta({ example: '2026-11-19' }),
    endDate: z.iso
      .date()
      .nullable()
      .meta({ example: '2026-11-26', description: 'null = sem término' }),
    continuousUse: z.boolean().meta({ description: 'Uso contínuo' }),
    active: z.boolean().meta({
      description: 'Calculado: sem término, ou o término é hoje ou depois',
    }),
    notes: z.string().nullable(),
    createdAt: z.iso.datetime(),
  })
  .meta({ id: 'Medication' })

const visitParams = { path: z.object({ visitId: uuid }) }
const visitNotFound = error(
  'Atendimento não existe ou é de outro usuário (VISIT_NOT_FOUND)',
)
const invalidDates = error('Término antes do início (INVALID_MEDICATION_DATES)')

export const medicationPaths: ZodOpenApiPathsObject = {
  '/visits/{visitId}/medications': {
    post: {
      tags: ['Medications'],
      operationId: 'registerMedication',
      summary: 'Prescreve uma medicação no atendimento',
      description:
        'Sem `startDate`, a medicação começa no dia do atendimento. Sem `endDate`, ela fica ativa até alguém pôr a data de término.',
      requestParams: visitParams,
      requestBody: {
        content: { 'application/json': { schema: registerMedicationSchema } },
      },
      responses: {
        '201': json('Medicação criada', medicationSchema),
        '400': badRequest,
        '401': unauthorized,
        '404': visitNotFound,
        '422': invalidDates,
      },
    },
    get: {
      tags: ['Medications'],
      operationId: 'listVisitMedications',
      summary: 'Medicações do atendimento',
      requestParams: visitParams,
      responses: {
        '200': json(
          'As medicações, da mais nova à mais antiga',
          z.array(medicationSchema),
        ),
        '401': unauthorized,
        '404': visitNotFound,
      },
    },
  },
  '/patients/{patientId}/medications': {
    get: {
      tags: ['Medications'],
      operationId: 'listPatientMedications',
      summary: 'Histórico de medicações do paciente',
      description: 'Junta as medicações de todos os atendimentos do paciente.',
      requestParams: {
        path: z.object({ patientId: uuid }),
        query: patientMedicationsQuerySchema,
      },
      responses: {
        '200': json(
          'As medicações, da mais nova à mais antiga',
          z.array(medicationSchema),
        ),
        '401': unauthorized,
        '404': error(
          'Paciente não existe ou é de outro usuário (PATIENT_NOT_FOUND)',
        ),
      },
    },
  },
  '/medications/{medicationId}': {
    patch: {
      tags: ['Medications'],
      operationId: 'updateMedication',
      summary: 'Muda uma medicação',
      description:
        'Campo ausente não muda. `endDate` e `notes` aceitam `null`. Para encerrar a medicação, mande o `endDate`.',
      requestParams: { path: z.object({ medicationId: uuid }) },
      requestBody: {
        content: { 'application/json': { schema: updateMedicationSchema } },
      },
      responses: {
        '200': json('A medicação atualizada', medicationSchema),
        '400': badRequest,
        '401': unauthorized,
        '404': error(
          'Medicação não existe ou é de outro usuário (MEDICATION_NOT_FOUND)',
        ),
        '422': invalidDates,
      },
    },
  },
}
