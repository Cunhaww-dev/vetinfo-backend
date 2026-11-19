import { z } from 'zod'
import type { ZodOpenApiPathsObject } from 'zod-openapi'
import {
  badRequest,
  error,
  json,
  unauthorized,
  uuid,
} from '../../../shared/docs/responses.ts'

const attachmentSchema = z
  .object({
    id: uuid,
    visitId: uuid,
    typeId: uuid,
    fileName: z.string().meta({ example: 'hemograma.pdf' }),
    contentType: z
      .enum(['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
      .meta({ description: 'Lido dos bytes do arquivo' }),
    sizeBytes: z.int().meta({ example: 182044 }),
    description: z.string().nullable(),
    fileUrl: z.string().meta({
      example: '/attachments/8641c516-3785-4f9f-bb2d-5a74479ce583/file',
      description: 'Rota do arquivo (pede a sessão)',
    }),
    createdAt: z.iso.datetime(),
  })
  .meta({ id: 'Attachment' })

const attachmentTypeSchema = z
  .object({ id: uuid, name: z.string().meta({ example: 'Radiografia' }) })
  .meta({ id: 'AttachmentType' })

const uploadSchema = z.object({
  file: z.string().meta({
    format: 'binary',
    description: 'PDF, JPEG, PNG ou WEBP, até 10 MB',
  }),
  typeId: uuid,
  description: z.string().optional(),
})

const visitParams = { path: z.object({ visitId: uuid }) }
const visitNotFound = error(
  'Atendimento não existe ou é de outro usuário (VISIT_NOT_FOUND)',
)

export const attachmentPaths: ZodOpenApiPathsObject = {
  '/attachment-types': {
    get: {
      tags: ['Attachments'],
      operationId: 'listAttachmentTypes',
      summary: 'Lista os tipos de anexo',
      responses: {
        '200': json('Os tipos, por nome', z.array(attachmentTypeSchema)),
        '401': unauthorized,
      },
    },
  },
  '/visits/{visitId}/attachments': {
    post: {
      tags: ['Attachments'],
      operationId: 'uploadAttachment',
      summary: 'Envia um anexo para o atendimento',
      description:
        'Corpo em `multipart/form-data`: o arquivo no campo `file`, mais `typeId` e `description`. O tipo do arquivo é lido dos bytes, e não do nome. O anexo não muda depois de criado.',
      requestParams: visitParams,
      requestBody: {
        content: { 'multipart/form-data': { schema: uploadSchema } },
      },
      responses: {
        '201': json('Anexo criado', attachmentSchema),
        '400': badRequest,
        '401': unauthorized,
        '404': error(
          'Atendimento (VISIT_NOT_FOUND) ou tipo de anexo (ATTACHMENT_TYPE_NOT_FOUND) não existe',
        ),
        '413': error('Arquivo maior que 10 MB (FILE_TOO_LARGE)'),
        '422': error(
          'Arquivo que não é PDF, JPEG, PNG nem WEBP (UNSUPPORTED_FILE_TYPE)',
        ),
      },
    },
    get: {
      tags: ['Attachments'],
      operationId: 'listVisitAttachments',
      summary: 'Anexos do atendimento',
      requestParams: visitParams,
      responses: {
        '200': json(
          'Os anexos, do mais novo ao mais antigo',
          z.array(attachmentSchema),
        ),
        '401': unauthorized,
        '404': visitNotFound,
      },
    },
  },
  '/patients/{patientId}/attachments': {
    get: {
      tags: ['Attachments'],
      operationId: 'listPatientAttachments',
      summary: 'Anexos do paciente',
      description: 'Junta os anexos de todos os atendimentos do paciente.',
      requestParams: { path: z.object({ patientId: uuid }) },
      responses: {
        '200': json(
          'Os anexos, do mais novo ao mais antigo',
          z.array(attachmentSchema),
        ),
        '401': unauthorized,
        '404': error(
          'Paciente não existe ou é de outro usuário (PATIENT_NOT_FOUND)',
        ),
      },
    },
  },
  '/attachments/{attachmentId}/file': {
    get: {
      tags: ['Attachments'],
      operationId: 'downloadAttachment',
      summary: 'Baixa o arquivo do anexo',
      requestParams: { path: z.object({ attachmentId: uuid }) },
      responses: {
        '200': {
          description: 'O arquivo, com o Content-Type dele',
          content: {
            'application/octet-stream': {
              schema: z.string().meta({ format: 'binary' }),
            },
          },
        },
        '401': unauthorized,
        '404': error(
          'Anexo não existe ou é de outro usuário (ATTACHMENT_NOT_FOUND)',
        ),
      },
    },
  },
}
