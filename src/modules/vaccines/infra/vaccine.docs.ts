import { z } from 'zod'
import type { ZodOpenApiPathsObject } from 'zod-openapi'
import {
  badRequest,
  error,
  json,
  unauthorized,
  uuid,
} from '../../../shared/docs/responses.ts'
import {
  dueVaccinesQuerySchema,
  registerVaccineSchema,
  updateVaccineSchema,
} from '../vaccine.schema.ts'

const vaccineSchema = z
  .object({
    id: uuid,
    patientId: uuid,
    visitId: uuid
      .nullable()
      .meta({ description: 'null = registrada sem atendimento' }),
    name: z.string().meta({ example: 'V10' }),
    appliedAt: z.iso.date().meta({ example: '2026-11-19' }),
    nextDoseAt: z.iso.date().nullable().meta({ example: '2027-11-19' }),
    manufacturer: z.string().nullable().meta({ example: 'Zoetis' }),
    batch: z
      .string()
      .nullable()
      .meta({ example: 'L12345', description: 'Lote' }),
    notes: z.string().nullable(),
    createdAt: z.iso.datetime(),
  })
  .meta({ id: 'Vaccine' })

const dueVaccineSchema = z
  .object({
    vaccineId: uuid,
    name: z.string().meta({ example: 'V10' }),
    nextDoseAt: z.iso.date(),
    overdue: z
      .boolean()
      .meta({ description: 'A data da próxima dose já passou' }),
    patient: z.object({ id: uuid, name: z.string().meta({ example: 'Thor' }) }),
  })
  .meta({ id: 'DueVaccine' })

const patientParams = { path: z.object({ patientId: uuid }) }
const patientNotFound = error(
  'Paciente não existe ou é de outro usuário (PATIENT_NOT_FOUND)',
)
const invalidDates = error(
  'Aplicação no futuro ou antes do nascimento, ou próxima dose antes da aplicação (INVALID_VACCINE_DATES)',
)

export const vaccinePaths: ZodOpenApiPathsObject = {
  '/patients/{patientId}/vaccines': {
    post: {
      tags: ['Vaccines'],
      operationId: 'registerVaccine',
      summary: 'Registra uma vacina no paciente',
      description:
        'O `visitId` é opcional: vacina de histórico antigo entra sem atendimento. Sem `appliedAt`, vale o dia do atendimento, ou hoje.',
      requestParams: patientParams,
      requestBody: {
        content: { 'application/json': { schema: registerVaccineSchema } },
      },
      responses: {
        '201': json('Vacina criada', vaccineSchema),
        '400': badRequest,
        '401': unauthorized,
        '404': error(
          'Paciente (PATIENT_NOT_FOUND) ou atendimento (VISIT_NOT_FOUND) não existe. Atendimento de outro paciente também dá VISIT_NOT_FOUND',
        ),
        '422': invalidDates,
      },
    },
    get: {
      tags: ['Vaccines'],
      operationId: 'listPatientVaccines',
      summary: 'Histórico vacinal do paciente',
      requestParams: patientParams,
      responses: {
        '200': json(
          'As vacinas, da mais nova à mais antiga',
          z.array(vaccineSchema),
        ),
        '401': unauthorized,
        '404': patientNotFound,
      },
    },
  },
  '/visits/{visitId}/vaccines': {
    get: {
      tags: ['Vaccines'],
      operationId: 'listVisitVaccines',
      summary: 'Vacinas aplicadas no atendimento',
      requestParams: { path: z.object({ visitId: uuid }) },
      responses: {
        '200': json('As vacinas', z.array(vaccineSchema)),
        '401': unauthorized,
        '404': error(
          'Atendimento não existe ou é de outro usuário (VISIT_NOT_FOUND)',
        ),
      },
    },
  },
  '/vaccines/due': {
    get: {
      tags: ['Vaccines'],
      operationId: 'listDueVaccines',
      summary: 'Próximas doses (lembrete de revacinação)',
      description:
        'As próximas doses até daqui a `days` dias, incluindo as atrasadas, da mais próxima para a mais distante. Uma dose sai da lista quando o paciente toma a mesma vacina (mesmo nome) depois.',
      requestParams: { query: dueVaccinesQuerySchema },
      responses: {
        '200': json('As doses pendentes', z.array(dueVaccineSchema)),
        '401': unauthorized,
      },
    },
  },
  '/vaccines/{vaccineId}': {
    patch: {
      tags: ['Vaccines'],
      operationId: 'updateVaccine',
      summary: 'Muda uma vacina',
      description:
        'Campo ausente não muda. Os campos opcionais aceitam `null`. O paciente e o atendimento nunca mudam.',
      requestParams: { path: z.object({ vaccineId: uuid }) },
      requestBody: {
        content: { 'application/json': { schema: updateVaccineSchema } },
      },
      responses: {
        '200': json('A vacina atualizada', vaccineSchema),
        '400': badRequest,
        '401': unauthorized,
        '404': error(
          'Vacina não existe ou é de outro usuário (VACCINE_NOT_FOUND)',
        ),
        '422': invalidDates,
      },
    },
  },
}
