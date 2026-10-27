import { Router } from 'express';
import { prisma } from '../../../shared/prisma/client.ts';
import { validateBody } from '../../../shared/http/validate-body.middleware.ts';
import { RegisterUser } from '../application/register-user.usecase.ts';
import { registerUserSchema } from '../user.schema.ts';
import { BetterAuthProvider } from './better-auth-provider.ts';
import { PrismaUserRepository } from './prisma-user.repository.ts';
import { UserController } from './user.controller.ts';

const userRepository = new PrismaUserRepository(prisma);
const authProvider = new BetterAuthProvider();

const controller = new UserController(
  new RegisterUser(userRepository, authProvider),
);

export const userRouter = Router();

userRouter.post(
  '/users',
  validateBody(registerUserSchema),
  controller.register,
);

// Esta é a parte mais importante do passo. Este arquivo é o único lugar onde as peças se encontram. É aqui que a porta (AuthProvider) recebe o adaptador real (BetterAuthProvider).
// O nome deste lugar é composition root. Em Clean Arch, só ele conhece todas as camadas. Se um dia você trocar o better-auth, a mudança é só uma linha aqui: new BetterAuthProvider() vira new OutroProvider().
