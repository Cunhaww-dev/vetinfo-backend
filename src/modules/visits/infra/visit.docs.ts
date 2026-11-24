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
  recentPatientsQuerySchema,
  registerVisitSchema,
  searchVisitsQuerySchema,
  updateVisitSchema,
} from '../visit.schema.ts'
import { bodyConditionScaleSchema } from '../../../shared/docs/body-condition-scale.ts'

const vitalSignsSchema = z
  .object({
    weightKg: z.number().nullable().meta({ example: 12.5 }),
    temperatureC: z.number().nullable().meta({ example: 38.6 }),
    heartRate: z.int().nullable().meta({ example: 110 }),
    respiratoryRate: z.int().nullable().meta({ example: 24 }),
    bodyConditionScore: z.number().nullable().meta({
      example: 5,
      description:
        'Escore corporal. Na escala 1-9, só inteiros. Na escala 1-5, passo de 0,5 (ex.: 3.5)',
    }),
    bodyConditionScale: bodyConditionScaleSchema.nullable().meta({
      description:
        'Vem da espécie no momento do registro. Só na resposta. null = sem escore',
    }),
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

const visitTypeSchema = z.enum(['consultation', 'vaccination']).meta({
  description:
    'Consulta ou vacinação. Escolhido na criação e nunca muda. A vacinação não tem SOAP: ele vem sempre vazio',
})

const finishedAtSchema = z.iso.datetime().nullable().meta({
  example: '2026-11-01T13:40:00.000Z',
  description:
    'null = em andamento. Com data = finalizado, e quando. Finalizar não trava a edição',
})

const visitSchema = z
  .object({
    id: uuid,
    patientId: uuid,
    authorType: z.enum(['professional', 'student']).meta({
      description:
        'Snapshot do tipo do autor no dia do atendimento. Nunca muda. Base do badge "atendimento de estudante".',
    }),
    type: visitTypeSchema,
    visitedAt: z.iso.datetime().meta({ example: '2026-11-01T13:00:00.000Z' }),
    finishedAt: finishedAtSchema,
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

const recentPatientSchema = z
  .object({
    visitId: uuid,
    visitedAt: z.iso.datetime(),
    patient: z.object({
      id: uuid,
      name: z.string().meta({ example: 'Thor' }),
      breedId: uuid,
      species: z.object({
        id: uuid,
        name: z.string().meta({ example: 'Cão' }),
      }),
    }),
  })
  .meta({ id: 'RecentPatient' })

const visitSummarySchema = z
  .object({
    id: uuid,
    visitedAt: z.iso.datetime(),
    authorType: z.enum(['professional', 'student']),
    type: visitTypeSchema,
    finishedAt: finishedAtSchema,
    vaccines: z.array(z.string()).meta({
      example: ['V10'],
      description: 'Os nomes das vacinas do atendimento. Vazio = nenhuma',
    }),
    assessment: z.string().nullable().meta({
      example: 'Gastroenterite',
      description: 'A avaliação do SOAP (o diagnóstico). null = vazia',
    }),
    patient: z.object({
      id: uuid,
      name: z.string().meta({ example: 'Thor' }),
      species: z.object({
        id: uuid,
        name: z.string().meta({ example: 'Cão' }),
      }),
      breed: z.object({ id: uuid, name: z.string().meta({ example: 'SRD' }) }),
    }),
    guardian: z
      .object({ id: uuid, name: z.string().meta({ example: 'Ana Souza' }) })
      .nullable(),
  })
  .meta({ id: 'VisitSummary' })

const visitPageSchema = z
  .object({
    items: z.array(visitSummarySchema),
    total: z.int().meta({ example: 42, description: 'Total com os filtros' }),
    page: z.int().meta({ example: 1 }),
    pageSize: z.int().meta({ example: 20 }),
  })
  .meta({ id: 'VisitPage' })

const patientParams = { path: z.object({ patientId: uuid }) }
const visitParams = { path: z.object({ visitId: uuid }) }
const patientNotFound = error(
  'Paciente não existe ou é de outro usuário (PATIENT_NOT_FOUND)',
)
const visitNotFound = error(
  'Atendimento não existe ou é de outro usuário (VISIT_NOT_FOUND)',
)
const invalidVisit = error(
  'Data no futuro (INVALID_VISIT_DATE), antes do nascimento do paciente (VISIT_BEFORE_BIRTH), sinal vital fora da faixa (INVALID_VITAL_SIGNS) ou SOAP num atendimento de vacinação (VACCINATION_VISIT_HAS_NO_SOAP)',
)

export const visitPaths: ZodOpenApiPathsObject = {
  '/patients/{patientId}/visits': {
    post: {
      tags: ['Visits'],
      operationId: 'registerVisit',
      summary: 'Cria um atendimento',
      description:
        'Todos os campos são opcionais. Sem `type`, é consulta. A vacinação não aceita SOAP: as vacinas e as observações dela vão pela rota de vacinas, com o `visitId`. Sem `visitedAt`, vale a hora atual. Faixas: peso 0,001 a 2000 kg (1 g a 2 t), temperatura 25 a 45 °C, FC 1 a 400, FR 1 a 200. O escore corporal segue a escala da espécie (`species.bodyConditionScale`): 1 a 9 com inteiros, ou 1 a 5 com passo de 0,5.',
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
  '/visits': {
    get: {
      tags: ['Visits'],
      operationId: 'searchVisits',
      summary: 'Todos os atendimentos, com filtros',
      description:
        'Os atendimentos de todos os pacientes do usuário, do mais novo ao mais antigo, 20 por página. Filtra por espécie, por tipo, por status e por período. Filtro inválido é ignorado, sem erro.',
      requestParams: { query: searchVisitsQuerySchema },
      responses: {
        '200': json('Uma página de atendimentos', visitPageSchema),
        '401': unauthorized,
      },
    },
  },
  '/visits/recent': {
    get: {
      tags: ['Visits'],
      operationId: 'listRecentPatients',
      summary: 'Pacientes atendidos há pouco',
      description:
        'Um item por paciente, com o atendimento mais novo dele, do mais novo para o mais velho. Serve para a lista "atendidos há pouco" da sidebar. Sem atendimentos, a lista vem vazia.',
      requestParams: { query: recentPatientsQuerySchema },
      responses: {
        '200': json('Os pacientes', z.array(recentPatientSchema)),
        '401': unauthorized,
      },
    },
  },
  '/visits/{visitId}/finish': {
    post: {
      tags: ['Visits'],
      operationId: 'finishVisit',
      summary: 'Finaliza um atendimento',
      description:
        'Marca o atendimento como finalizado, com a data de agora. Finalizar de novo não é erro: a data continua a da primeira vez. Depois de finalizado, o atendimento ainda pode ser editado.',
      requestParams: visitParams,
      responses: {
        '200': json('O atendimento finalizado', visitSchema),
        '401': unauthorized,
        '404': visitNotFound,
      },
    },
  },
  '/visits/{visitId}': {
    delete: {
      tags: ['Visits'],
      operationId: 'deleteVisit',
      summary: 'Apaga um atendimento (soft delete)',
      description:
        'O atendimento some do app, e com ele as medicações, vacinas e anexos dele. Os dados ficam no banco (soft delete). Não tem volta pela API.',
      requestParams: { path: z.object({ visitId: uuid }) },
      responses: {
        '204': { description: 'Atendimento apagado' },
        '401': unauthorized,
        '404': error(
          'Atendimento não existe, é de outro usuário ou já foi apagado (VISIT_NOT_FOUND)',
        ),
      },
    },
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
        'Campo ausente não muda. `null` apaga o campo. O autor, o `authorType` e o `type` nunca mudam.',
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
