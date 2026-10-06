import { randomUUID } from 'node:crypto';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '../prisma/client.ts';

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }), // A lib usa o nosso client, acha a table pelo nome do model

  emailAndPassword: { enabled: true },

  user: {
    additionalFields: {
      // Ensinando pra lib as nossas colunas. input: false imoede o cliente de mandar esse campo no cadastro, o server que preenche
      type: { type: ['professional', 'student'], required: true },
      crmv: { type: 'string', required: false },
      crmvActivatedAt: { type: 'date', required: false, input: false },
    },
  },

  advanced: {
    database: { generateId: () => randomUUID() }, // UUID padrão
  },
});
