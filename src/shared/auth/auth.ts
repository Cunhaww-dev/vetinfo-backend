import { randomUUID } from 'node:crypto';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '../prisma/client.ts';
import { APIError, createAuthMiddleware } from 'better-auth/api';

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
        throw new APIError('NOT_FOUND');
      }
    }),
  },

  advanced: {
    database: { generateId: () => randomUUID() }, // UUID padrão
  },
});
