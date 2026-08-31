import { Router } from 'express';
import { prisma } from '../../../shared/prisma/client.ts';
import { validateBody } from '../../../shared/http/validate-body.middleware.ts';
import { AuthenticateUser } from '../application/authenticate-user.usecase.ts';
import { RegisterUser } from '../application/register-user.usecase.ts';
import { authenticateUserSchema, registerUserSchema } from '../user.schema.ts';
import { BcryptHashProvider } from './bcrypt-hash.provider.ts';
import { PrismaUserRepository } from './prisma-user.repository.ts';
import { UserController } from './user.controller.ts';

const userRepository = new PrismaUserRepository(prisma);
const hashProvider = new BcryptHashProvider();

const controller = new UserController(
  new RegisterUser(userRepository, hashProvider),
  new AuthenticateUser(userRepository, hashProvider),
);

export const userRouter = Router();

userRouter.post('/users', validateBody(registerUserSchema), controller.register);
userRouter.post('/sessions', validateBody(authenticateUserSchema), controller.authenticate);
