import { z } from 'zod'
import type { ZodOpenApiPathsObject } from 'zod-openapi'
import {
  badRequest,
  error,
  json,
  unauthorized,
  uuid,
} from '../../../shared/docs/responses.ts'
import { registerConsentSchema } from '../consent.schema.ts'

const consentSchema = z
  .object({
    id: uuid,
    guardianId: uuid.meta({ description: 'O tutor que autorizou' }),
    patientId: uuid,
    termVersion: z
      .string()
      .meta({ example: '1', description: 'Versão do termo aceito' }),
    acceptedAt: z.iso.datetime(),
    revokedAt: z.iso.datetime().nullable(),
    active: z.boolean().meta({ description: 'Ainda não foi revogado' }),
    notes: z.string().nullable(),
    createdAt: z.iso.datetime(),
  })
  .meta({ id: 'GuardianConsent' })

const patientParams = { path: z.object({ patientId: uuid }) }
const patientNotFound = error(
  'Paciente não existe ou é de outro usuário (PATIENT_NOT_FOUND)',
)

export const consentPaths: ZodOpenApiPathsObject = {
  '/patients/{patientId}/consents': {
    post: {
      tags: ['Consents'],
      operationId: 'registerConsent',
      summary: 'Registra o consentimento do tutor',
      description:
        'O veterinário registra que o tutor atual do paciente aceitou o termo de compartilhamento para estudo. Sem `acceptedAt`, vale agora. Só um consentimento ativo por tutor e paciente.',
      requestParams: patientParams,
      requestBody: {
        content: { 'application/json': { schema: registerConsentSchema } },
      },
      responses: {
        '201': json('Consentimento registrado', consentSchema),
        '400': badRequest,
        '401': unauthorized,
        '404': patientNotFound,
        '409': error(
          'O tutor já tem um consentimento ativo para o paciente (CONSENT_ALREADY_ACTIVE)',
        ),
        '422': error(
          'Paciente sem tutor (PATIENT_WITHOUT_GUARDIAN) ou data no futuro (INVALID_CONSENT_DATE)',
        ),
      },
    },
    get: {
      tags: ['Consents'],
      operationId: 'listConsents',
      summary: 'Histórico de consentimentos do paciente',
      description:
        'Inclui os revogados, para a rastreabilidade. **Só vale o consentimento do tutor atual do paciente:** se o paciente mudar de tutor, o consentimento do tutor antigo continua no histórico, mas não libera compartilhamento.',
      requestParams: patientParams,
      responses: {
        '200': json(
          'Os consentimentos, do mais novo ao mais antigo',
          z.array(consentSchema),
        ),
        '401': unauthorized,
        '404': patientNotFound,
      },
    },
  },
  '/consents/{consentId}/revoke': {
    post: {
      tags: ['Consents'],
      operationId: 'revokeConsent',
      summary: 'Revoga o consentimento',
      description:
        'Sem volta. Os compartilhamentos para estudo deste paciente param de mostrar o paciente na hora.',
      requestParams: { path: z.object({ consentId: uuid }) },
      responses: {
        '200': json('O consentimento revogado', consentSchema),
        '401': unauthorized,
        '404': error(
          'Consentimento não existe ou é de outro usuário (CONSENT_NOT_FOUND)',
        ),
        '409': error('Já estava revogado (CONSENT_ALREADY_REVOKED)'),
      },
    },
  },
}
