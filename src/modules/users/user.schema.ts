import { z } from 'zod';

// Validação de borda: só responde "essa requisição está bem formada?".
// A regra de negócio (profissional exige CRMV) NÃO mora aqui, mora na entidade,
// senão ela só valeria para quem entra por HTTP.

export const registerUserSchema = z.object({
  name: z.string().trim().min(3, 'Name must have at least 3 characters'),
  email: z.email('Invalid email format'),
  password: z.string().min(8, 'Password must have at least 8 characters'),
  type: z.enum(['professional', 'student']),
  crmv: z.string().trim().nullish(),
});

export const authenticateUserSchema = z.object({
  email: z.email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});
