import { Router } from 'express'
import { prisma } from '../../../shared/prisma/client.ts'
import { ensureAuthenticated } from '../../../shared/http/ensure-authenticated.middleware.ts'
import { validateBody } from '../../../shared/http/validate-body.middleware.ts'
import { GetUserProfile } from '../application/get-user-profile.usecase.ts'
import { activateCrmvSchema, registerUserSchema } from '../user.schema.ts'
import { RegisterUser } from '../application/register-user.usecase.ts'
import { ActivateCrmv } from '../application/activate-crmv.usecase.ts'
import { BetterAuthProvider } from './better-auth-provider.ts'
import { PrismaUserRepository } from './prisma-user.repository.ts'
import { UserController } from './user.controller.ts'

const userRepository = new PrismaUserRepository(prisma)
const authProvider = new BetterAuthProvider()

const controller = new UserController(
  new RegisterUser(userRepository, authProvider),
  new GetUserProfile(userRepository),
  new ActivateCrmv(userRepository),
)

export const userRouter = Router()

userRouter.post('/users', validateBody(registerUserSchema), controller.register)

userRouter.get('/users/me', ensureAuthenticated, controller.me)

userRouter.patch(
  '/users/me/crmv',
  ensureAuthenticated,
  validateBody(activateCrmvSchema),
  controller.activateCrmv,
)

// Esta é a parte mais importante do passo. Este arquivo é o único lugar onde as peças se encontram. É aqui que a porta (AuthProvider) recebe o adaptador real (BetterAuthProvider).
// O nome deste lugar é composition root. Em Clean Arch, só ele conhece todas as camadas. Se um dia você trocar o better-auth, a mudança é só uma linha aqui: new BetterAuthProvider() vira new OutroProvider().
