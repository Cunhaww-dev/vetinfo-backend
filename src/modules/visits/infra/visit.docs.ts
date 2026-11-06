import { z } from 'zod'
import type { ZodOpenApiPathsObject } from 'zod-openapi'
import {
  badRequest,
  error,
  json,
  unauthorized,
  uuid,
} from '../../../shared/docs/responses.ts'
import { registerVisitSchema, updateVisitSchema } from '../visit.schema.ts'

const vitalSignsSchema = z
  .object({
    weightKg: z.number().nullable().meta({ example: 12.5 }),
    temperatureC: z.number().nullable().meta({ example: 38.6 }),
    heartRate: z.int().nullable().meta({ example: 110 }),
    respiratoryRate: z.int().nullable().meta({ example: 24 }),
  })
  .meta({ id: 'VitalSigns' })

const soapSchema = z
  .object({
    subjective: z.string().nullable().meta({ example: 'Vômito há 2 dias' }),
    objective: z.string().nullable().meta({ example: 'Desidratação leve' }),
    assessment: z.string().nullable().meta({ example: 'Gastroenterite' }),
    plan: z.string().nullable().meta({ example: 'Soro e dieta' }),
  })
  .meta({ id: 'Soap' })

const visitSchema = z
  .object({
    id: uuid,
    patientId: uuid,
    authorType: z.enum(['professional', 'student']).meta({
      description:
        'Snapshot do tipo do autor no dia do atendimento. Nunca muda. Base do badge "atendimento de estudante".',
    }),
    visitedAt: z.iso.datetime().meta({ example: '2026-11-01T13:00:00.000Z' }),
    vitalSigns: vitalSignsSchema,
    soap: soapSchema,
  })
  .meta({ id: 'Visit' })

const latestVitalSignsSchema = z
  .object({
    visitId: uuid,
    visitedAt: z.iso.datetime(),
    ...vitalSignsSchema.shape,
  })
  .nullable()
  .meta({ id: 'LatestVitalSigns' })

const patientParams = { path: z.object({ patientId: uuid }) }
const visitParams = { path: z.object({ visitId: uuid }) }
const patientNotFound = error(
  'Paciente não existe ou é de outro usuário (PATIENT_NOT_FOUND)',
)
const visitNotFound = error(
  'Atendimento não existe ou é de outro usuário (VISIT_NOT_FOUND)',
)
const invalidVisit = error(
  'Data no futuro (INVALID_VISIT_DATE) ou sinal vital fora da faixa (INVALID_VITAL_SIGNS)',
)

export const visitPaths: ZodOpenApiPathsObject = {
  '/patients/{patientId}/visits': {
    post: {
      tags: ['Visits'],
      operationId: 'registerVisit',
      summary: 'Cria um atendimento',
      description:
        'Todos os campos são opcionais. Sem `visitedAt`, vale a hora atual. Faixas: peso 0,01 a 2000 kg, temperatura 25 a 45 °C, FC 1 a 400, FR 1 a 200.',
      requestParams: patientParams,
      requestBody: {
        content: { 'application/json': { schema: registerVisitSchema } },
      },
      responses: {
        '201': json('Atendimento criado', visitSchema),
        '400': badRequest,
        '401': unauthorized,
        '404': patientNotFound,
        '422': invalidVisit,
      },
    },
    get: {
      tags: ['Visits'],
      operationId: 'listVisits',
      summary: 'Histórico de atendimentos do paciente',
      requestParams: patientParams,
      responses: {
        '200': json(
          'Os atendimentos, do mais novo ao mais antigo',
          z.array(visitSchema),
        ),
        '401': unauthorized,
        '404': patientNotFound,
      },
    },
  },
  '/patients/{patientId}/vital-signs/latest': {
    get: {
      tags: ['Visits'],
      operationId: 'getLatestVitalSigns',
      summary: 'Últimos sinais vitais do paciente',
      description:
        'Vem do último atendimento com pelo menos 1 sinal preenchido. Serve para sugerir os valores no novo atendimento. `null` = nenhum sinal registrado.',
      requestParams: patientParams,
      responses: {
        '200': json('Os sinais vitais, ou null', latestVitalSignsSchema),
        '401': unauthorized,
        '404': patientNotFound,
      },
    },
  },
  '/visits/{visitId}': {
    get: {
      tags: ['Visits'],
      operationId: 'getVisit',
      summary: 'Mostra um atendimento',
      requestParams: visitParams,
      responses: {
        '200': json('O atendimento', visitSchema),
        '401': unauthorized,
        '404': visitNotFound,
      },
    },
    patch: {
      tags: ['Visits'],
      operationId: 'updateVisit',
      summary: 'Muda um atendimento',
      description:
        'Campo ausente não muda. `null` apaga o campo. O autor e o `authorType` nunca mudam.',
      requestParams: visitParams,
      requestBody: {
        content: { 'application/json': { schema: updateVisitSchema } },
      },
      responses: {
        '200': json('O atendimento atualizado', visitSchema),
        '400': badRequest,
        '401': unauthorized,
        '404': visitNotFound,
        '422': invalidVisit,
      },
    },
  },
}
