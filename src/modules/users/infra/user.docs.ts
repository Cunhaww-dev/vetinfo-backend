import { z } from 'zod'
import type { ZodOpenApiPathsObject } from 'zod-openapi'
import {
  badRequest,
  error,
  json,
  unauthorized,
  uuid,
} from '../../../shared/docs/responses.ts'
import { activateCrmvSchema, registerUserSchema } from '../user.schema.ts'

const userSchema = z
  .object({
    id: uuid,
    name: z.string().meta({ example: 'João Silva' }),
    email: z.email().meta({ example: 'joao@test.com' }),
    type: z.enum(['professional', 'student']),
    crmv: z.string().nullable().meta({ example: 'RJ54321' }),
  })
  .meta({ id: 'User' })

const signInSchema = z.object({
  email: z.email().meta({ example: 'joao@test.com' }),
  password: z.string().meta({ example: '12345678' }),
})

export const userPaths: ZodOpenApiPathsObject = {
  '/users': {
    post: {
      tags: ['Users'],
      operationId: 'registerUser',
      summary: 'Cadastra um veterinário',
      description:
        '`professional` exige CRMV: UF + 1 a 6 números, com `S` no fim na inscrição secundária (ex.: `RJ54321`, `SP1234S`). `student` entra sem CRMV.',
      security: [],
      requestBody: {
        content: { 'application/json': { schema: registerUserSchema } },
      },
      responses: {
        '201': json('Usuário criado', userSchema),
        '400': badRequest,
        '409': error('E-mail já cadastrado (EMAIL_ALREADY_IN_USE)'),
        '422': error(
          'CRMV faltando ou fora do formato (CRMV_REQUIRED_FOR_PROFESSIONAL, INVALID_CRMV_FORMAT)',
        ),
      },
    },
  },
  '/users/me': {
    get: {
      tags: ['Users'],
      operationId: 'getMe',
      summary: 'Perfil do usuário logado',
      responses: {
        '200': json('O usuário', userSchema),
        '401': unauthorized,
      },
    },
  },
  '/users/me/crmv': {
    patch: {
      tags: ['Users'],
      operationId: 'activateCrmv',
      summary: 'Estudante ativa o CRMV e vira professional',
      description:
        'Não tem volta. Os atendimentos antigos continuam `student`.',
      requestBody: {
        content: { 'application/json': { schema: activateCrmvSchema } },
      },
      responses: {
        '200': json('O usuário, agora professional', userSchema),
        '400': badRequest,
        '401': unauthorized,
        '409': error('O CRMV já foi ativado (CRMV_ALREADY_ACTIVATED)'),
        '422': error('CRMV fora do formato (INVALID_CRMV_FORMAT)'),
      },
    },
  },
  // As 3 rotas abaixo são do better-auth. Elas estão aqui só para a doc ficar completa.
  '/api/auth/sign-in/email': {
    post: {
      tags: ['Auth'],
      operationId: 'signIn',
      summary: 'Login',
      description:
        'Grava o cookie de sessão. E-mail inexistente e senha errada dão a mesma resposta (401).\n\n' +
        'O token não vem no corpo, só no cookie httpOnly. Assim um script de XSS não consegue ler o token.',
      security: [],
      requestBody: {
        content: { 'application/json': { schema: signInSchema } },
      },
      responses: {
        '200': json(
          'Sessão criada. O cookie vem no Set-Cookie',
          z.object({ redirect: z.boolean(), user: z.looseObject({}) }),
        ),
        '401': { description: 'E-mail ou senha errados' },
      },
    },
  },
  '/api/auth/get-session': {
    get: {
      tags: ['Auth'],
      operationId: 'getSession',
      summary: 'Sessão atual',
      responses: {
        '200': json(
          'A sessão e o usuário, ou null sem sessão',
          z
            .object({ session: z.looseObject({}), user: z.looseObject({}) })
            .nullable(),
        ),
      },
    },
  },
  '/api/auth/sign-out': {
    post: {
      tags: ['Auth'],
      operationId: 'signOut',
      summary: 'Logout',
      requestBody: {
        content: { 'application/json': { schema: z.object({}) } },
      },
      responses: {
        '200': json('Sessão encerrada', z.object({ success: z.boolean() })),
      },
    },
  },
}
