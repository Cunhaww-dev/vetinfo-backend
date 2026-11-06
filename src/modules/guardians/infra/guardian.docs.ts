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
  addressSchema,
  createGuardianSchema,
  updateGuardianSchema,
} from '../guardian.schema.ts'

const addressResponseSchema = z
  .object({
    street: z.string().meta({ example: 'Rua das Flores' }),
    number: z.string().meta({ example: '100' }),
    complement: z.string().nullable(),
    district: z.string().meta({ example: 'Centro' }),
    city: z.string().meta({ example: 'Rio de Janeiro' }),
    state: z.string().meta({ example: 'RJ' }),
    zipCode: z.string().meta({ example: '20010000' }),
  })
  .meta({ id: 'Address' })

const guardianSchema = z
  .object({
    id: uuid,
    name: z.string().meta({ example: 'Maria Souza' }),
    phone: z.string().nullable().meta({ example: '21999990000' }),
    email: z.email().nullable(),
    address: addressResponseSchema
      .nullable()
      .meta({ description: 'Só o endereço atual' }),
  })
  .meta({ id: 'Guardian' })

const guardianParams = { path: z.object({ guardianId: uuid }) }
const notFound = error(
  'Tutor não existe ou é de outro usuário (GUARDIAN_NOT_FOUND)',
)
const invalidAddress = error('UF ou CEP inválido (INVALID_ADDRESS)')

export const guardianPaths: ZodOpenApiPathsObject = {
  '/guardians': {
    post: {
      tags: ['Guardians'],
      operationId: 'createGuardian',
      summary: 'Cria um tutor',
      description: 'O endereço é opcional. O CEP aceita hífen (`01310-100`).',
      requestBody: {
        content: { 'application/json': { schema: createGuardianSchema } },
      },
      responses: {
        '201': json('Tutor criado', guardianSchema),
        '400': badRequest,
        '401': unauthorized,
        '422': invalidAddress,
      },
    },
    get: {
      tags: ['Guardians'],
      operationId: 'listGuardians',
      summary: 'Lista os tutores do usuário',
      responses: {
        '200': json('Os tutores, por nome', z.array(guardianSchema)),
        '401': unauthorized,
      },
    },
  },
  '/guardians/{guardianId}': {
    get: {
      tags: ['Guardians'],
      operationId: 'getGuardian',
      summary: 'Mostra um tutor',
      requestParams: guardianParams,
      responses: {
        '200': json('O tutor', guardianSchema),
        '401': unauthorized,
        '404': notFound,
      },
    },
    patch: {
      tags: ['Guardians'],
      operationId: 'updateGuardian',
      summary: 'Muda nome, telefone ou e-mail',
      description: 'Campo ausente não muda. `null` apaga o campo.',
      requestParams: guardianParams,
      requestBody: {
        content: { 'application/json': { schema: updateGuardianSchema } },
      },
      responses: {
        '200': json('O tutor atualizado', guardianSchema),
        '400': badRequest,
        '401': unauthorized,
        '404': notFound,
      },
    },
  },
  '/guardians/{guardianId}/address': {
    put: {
      tags: ['Guardians'],
      operationId: 'changeGuardianAddress',
      summary: 'Muda o endereço',
      description: 'O endereço antigo fica no banco como histórico.',
      requestParams: guardianParams,
      requestBody: {
        content: { 'application/json': { schema: addressSchema } },
      },
      responses: {
        '200': json('O tutor com o endereço novo', guardianSchema),
        '400': badRequest,
        '401': unauthorized,
        '404': notFound,
        '422': invalidAddress,
      },
    },
  },
}
