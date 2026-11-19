import { z } from 'zod'
import type { ZodOpenApiPathsObject } from 'zod-openapi'
import {
  badRequest,
  error,
  json,
  unauthorized,
  uuid,
} from '../../../shared/docs/responses.ts'
import { createShareSchema } from '../share.schema.ts'

const shareSchema = z
  .object({
    id: uuid,
    type: z.enum(['guardian', 'third_party']).meta({
      description:
        '`guardian` = o tutor. `third_party` = estudo, exige consentimento',
    }),
    guardianId: uuid.nullable(),
    patientIds: z.array(uuid),
    code: z.string().meta({ example: 'K7QM2XRP9A' }),
    recipientName: z.string().nullable().meta({ example: 'Prof. Ana' }),
    expiresAt: z.iso.datetime(),
    maxUses: z.int().nullable().meta({ description: 'null = sem limite' }),
    usesCount: z.int(),
    status: z.enum(['active', 'revoked', 'expired', 'exhausted']),
    revokedAt: z.iso.datetime().nullable(),
    createdAt: z.iso.datetime(),
  })
  .meta({ id: 'Share' })

const shareUseSchema = z.object({
  usedAt: z.iso.datetime(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
})

const sharedVisitSchema = z.object({
  id: uuid,
  visitedAt: z.iso.datetime(),
  authorType: z.enum(['professional', 'student']),
  vitalSigns: z.object({
    weightKg: z.number().nullable(),
    temperatureC: z.number().nullable(),
    heartRate: z.int().nullable(),
    respiratoryRate: z.int().nullable(),
    bodyConditionScore: z.int().nullable(),
  }),
  soap: z.object({
    subjective: z.string().nullable(),
    objective: z.string().nullable(),
    assessment: z.string().nullable(),
    plan: z.string().nullable(),
  }),
  medications: z.array(
    z.object({
      name: z.string(),
      dosage: z.string(),
      frequency: z.string(),
      route: z.string(),
      startDate: z.iso.date(),
      endDate: z.iso.date().nullable(),
      continuousUse: z.boolean(),
    }),
  ),
  attachments: z.array(
    z.object({
      id: uuid,
      type: z.string().meta({ example: 'Radiografia' }),
      fileName: z.string(),
      contentType: z.string(),
      sizeBytes: z.int(),
      description: z.string().nullable(),
      fileUrl: z.string().meta({ description: 'Rota pública do arquivo' }),
    }),
  ),
})

const sharedRecordSchema = z
  .object({
    type: z.enum(['guardian', 'third_party']),
    expiresAt: z.iso.datetime(),
    patients: z.array(
      z.object({
        id: uuid,
        name: z.string().meta({ example: 'Thor' }),
        sex: z.enum(['male', 'female']),
        neutered: z.boolean(),
        coatColor: z.string().nullable(),
        birthDate: z.iso.date(),
        microchip: z
          .string()
          .nullable()
          .meta({ description: 'Sempre null no tipo third_party' }),
        breed: z.string().meta({ example: 'Labrador' }),
        species: z.string().meta({ example: 'Cão' }),
        visits: z.array(sharedVisitSchema),
        vaccines: z.array(
          z.object({
            name: z.string(),
            appliedAt: z.iso.date(),
            nextDoseAt: z.iso.date().nullable(),
            manufacturer: z.string().nullable(),
            batch: z.string().nullable(),
          }),
        ),
      }),
    ),
  })
  .meta({ id: 'SharedRecord' })

const shareParams = { path: z.object({ shareId: uuid }) }
const shareNotFound = error(
  'Compartilhamento não existe ou é de outro usuário (SHARE_NOT_FOUND)',
)
const codeParams = { code: z.string().meta({ example: 'K7QM2XRP9A' }) }
const notAvailable = error(
  'Código revogado, vencido, sem usos ou sem consentimento (SHARE_NOT_AVAILABLE)',
)

export const sharePaths: ZodOpenApiPathsObject = {
  '/shares': {
    post: {
      tags: ['Shares'],
      operationId: 'createShare',
      summary: 'Cria um código de acesso somente leitura',
      description:
        '`guardian`: o tutor vê os próprios animais. Precisa do `guardianId`, e todos os pacientes são dele. `third_party` (estudo): todo paciente precisa do consentimento ativo do tutor atual. Sem `expiresAt`, vale 7 dias (máximo 90). Sem `maxUses`, não tem limite.',
      requestBody: {
        content: { 'application/json': { schema: createShareSchema } },
      },
      responses: {
        '201': json('Código criado', shareSchema),
        '400': badRequest,
        '401': unauthorized,
        '404': error(
          'Paciente (PATIENT_NOT_FOUND) ou tutor (GUARDIAN_NOT_FOUND) não existe',
        ),
        '422': error(
          'Paciente sem consentimento (CONSENT_REQUIRED), paciente de outro tutor (PATIENT_NOT_FROM_GUARDIAN), guardianId errado para o tipo (INVALID_SHARE_GUARDIAN) ou prazo inválido (INVALID_SHARE_EXPIRATION)',
        ),
      },
    },
    get: {
      tags: ['Shares'],
      operationId: 'listShares',
      summary: 'Lista os códigos do usuário',
      responses: {
        '200': json(
          'Os códigos, do mais novo ao mais antigo',
          z.array(shareSchema),
        ),
        '401': unauthorized,
      },
    },
  },
  '/shares/{shareId}': {
    get: {
      tags: ['Shares'],
      operationId: 'getShare',
      summary: 'Mostra um código, com os acessos',
      requestParams: shareParams,
      responses: {
        '200': json(
          'O código e a lista de acessos (auditoria)',
          shareSchema.extend({ uses: z.array(shareUseSchema) }),
        ),
        '401': unauthorized,
        '404': shareNotFound,
      },
    },
  },
  '/shares/{shareId}/revoke': {
    post: {
      tags: ['Shares'],
      operationId: 'revokeShare',
      summary: 'Revoga o código',
      description: 'Sem volta. O código para de funcionar na hora.',
      requestParams: shareParams,
      responses: {
        '200': json('O código revogado', shareSchema),
        '401': unauthorized,
        '404': shareNotFound,
        '409': error('Já estava revogado (SHARE_ALREADY_REVOKED)'),
      },
    },
  },
  '/public/shares/{code}': {
    get: {
      tags: ['Shares'],
      operationId: 'accessShare',
      summary: 'Abre o prontuário pelo código (pública)',
      description:
        'Sem login. Cada chamada conta um uso e fica registrada. Mostra o paciente, os atendimentos com SOAP, as medicações, os anexos e as vacinas. Nunca mostra os dados do tutor. No estudo, o microchip vem `null`, e um paciente com o consentimento revogado some da resposta.',
      security: [],
      requestParams: { path: z.object(codeParams) },
      responses: {
        '200': json('O prontuário', sharedRecordSchema),
        '404': error('Código não existe (SHARE_NOT_FOUND)'),
        '410': notAvailable,
      },
    },
  },
  '/public/shares/{code}/attachments/{attachmentId}': {
    get: {
      tags: ['Shares'],
      operationId: 'downloadSharedAttachment',
      summary: 'Baixa um anexo pelo código (pública)',
      description:
        'Não conta um uso. Funciona enquanto o código não for revogado nem vencer.',
      security: [],
      requestParams: {
        path: z.object({ ...codeParams, attachmentId: uuid }),
      },
      responses: {
        '200': {
          description: 'O arquivo',
          content: {
            'application/octet-stream': {
              schema: z.string().meta({ format: 'binary' }),
            },
          },
        },
        '404': error(
          'Código (SHARE_NOT_FOUND) ou anexo (ATTACHMENT_NOT_FOUND) não existe',
        ),
        '410': notAvailable,
      },
    },
  },
}
