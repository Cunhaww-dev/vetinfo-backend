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
    phone: z.string().meta({ example: '21999990000' }),
    email: z.email().meta({ example: 'maria@email.com' }),
    cpf: z.string().nullable().meta({
      example: '52998224725',
      description:
        'Só os 11 dígitos. Na lista (`GET /guardians`), vem mascarado: `***.982.247-**`',
    }),
    birthDate: z.iso.date().meta({ example: '1990-05-31' }),
    address: addressResponseSchema
      .nullable()
      .meta({ description: 'Só o endereço atual' }),
    createdAt: z.iso.datetime().meta({ description: 'Data do cadastro' }),
  })
  .meta({ id: 'Guardian' })

const guardianParams = { path: z.object({ guardianId: uuid }) }
const notFound = error(
  'Tutor não existe ou é de outro usuário (GUARDIAN_NOT_FOUND)',
)
const invalidAddress = error('UF ou CEP inválido (INVALID_ADDRESS)')
const invalidData = error(
  'CPF inválido (INVALID_CPF) ou nascimento no futuro (INVALID_BIRTH_DATE)',
)
const cpfInUse = error(
  'Outro tutor deste usuário já tem o CPF (CPF_ALREADY_IN_USE)',
)

export const guardianPaths: ZodOpenApiPathsObject = {
  '/guardians': {
    post: {
      tags: ['Guardians'],
      operationId: 'createGuardian',
      summary: 'Cria um tutor',
      description:
        'O CPF e o endereço são opcionais. O CPF aceita pontos e hífen (`529.982.247-25`). O CEP aceita hífen (`01310-100`).',
      requestBody: {
        content: { 'application/json': { schema: createGuardianSchema } },
      },
      responses: {
        '201': json('Tutor criado', guardianSchema),
        '400': badRequest,
        '401': unauthorized,
        '409': cpfInUse,
        '422': error(
          'Endereço (INVALID_ADDRESS), CPF (INVALID_CPF) ou nascimento (INVALID_BIRTH_DATE) inválido',
        ),
      },
    },
    get: {
      tags: ['Guardians'],
      operationId: 'listGuardians',
      summary: 'Lista os tutores do usuário',
      responses: {
        '200': json(
          'Os tutores, por nome. O CPF vem mascarado (`***.982.247-**`). Para ver o CPF inteiro, use o GET do tutor',
          z.array(guardianSchema),
        ),
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
      summary: 'Muda os dados do tutor',
      description:
        'Campo ausente não muda. Só o CPF aceita `null`, que apaga o campo.',
      requestParams: guardianParams,
      requestBody: {
        content: { 'application/json': { schema: updateGuardianSchema } },
      },
      responses: {
        '200': json('O tutor atualizado', guardianSchema),
        '400': badRequest,
        '401': unauthorized,
        '404': notFound,
        '409': cpfInUse,
        '422': invalidData,
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
