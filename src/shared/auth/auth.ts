import { randomUUID } from 'node:crypto'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from '../prisma/client.ts'
import { APIError, createAuthMiddleware } from 'better-auth/api'

type WithToken = { token?: unknown }

// Tira o token da sessão do corpo da resposta. O token já vai no cookie httpOnly,
// que o JS da página não lê. No corpo, um script de XSS conseguiria roubar o token.
function hideToken(body: unknown): unknown {
  if (Array.isArray(body)) return body.map(hideToken) // /list-sessions
  if (!body || typeof body !== 'object') return body

  const { token: _token, ...rest } = body as WithToken
  if ('session' in rest) rest.session = hideToken(rest.session) // /get-session
  return rest
}

const ROUTES_WITH_TOKEN = ['/sign-in/email', '/get-session', '/list-sessions']

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }), // A lib usa o nosso client, acha a table pelo nome do model

  emailAndPassword: { enabled: true },

  user: {
    additionalFields: {
      // Ensinando pra lib as nossas colunas.
      type: { type: ['professional', 'student'], required: true },
      crmv: { type: 'string', required: false },
      crmvActivatedAt: { type: 'date', required: false },
    },
  },

  hooks: {
    // Fecha o cadastro direto por HTTP. O cadastro passa por POST/users que valida o CRMV na entity
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === '/sign-up/email' && ctx.request) {
        throw new APIError('NOT_FOUND')
      }
    }),

    // Só nas chamadas HTTP. O ensureAuthenticated chama o getSession por dentro, sem request.
    after: createAuthMiddleware(async (ctx) => {
      if (!ctx.request || !ROUTES_WITH_TOKEN.includes(ctx.path)) return

      const body = ctx.context.returned
      if (body instanceof APIError) return

      // O ctx.json pede um objeto. O corpo dessas 3 rotas é objeto, lista ou null
      return ctx.json(hideToken(body) as Record<string, unknown> | null)
    }),
  },

  advanced: {
    database: { generateId: () => randomUUID() }, // UUID padrão
  },
})
