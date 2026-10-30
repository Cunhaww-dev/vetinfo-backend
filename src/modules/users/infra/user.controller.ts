import type { Request, Response } from 'express'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import type { AuthLocals } from '../../../shared/http/ensure-authenticated.middleware.ts'
import type { GetUserProfile } from '../application/get-user-profile.usecase.ts'
import type { RegisterUser } from '../application/register-user.usecase.ts'
import type { ActivateCrmv } from '../application/activate-crmv.usecase.ts'
import type { User } from '../domain/user-entity.ts'

const STATUS_BY_ERROR_CODE: Record<string, number> = {
  EMAIL_ALREADY_IN_USE: 409,
  CRMV_REQUIRED_FOR_PROFESSIONAL: 422,
  INVALID_CRMV_FORMAT: 422,
  USER_NOT_FOUND: 404,
  CRMV_ALREADY_ACTIVATED: 409,
}

function sendDomainError(res: Response, error: DomainError) {
  const status = STATUS_BY_ERROR_CODE[error.code] ?? 400
  return res.status(status).json({ code: error.code, message: error.message })
}

// Formato do User na resposta HTTP. Um lugar só, as duas rotas usam.
function toHttp(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    type: user.type,
    crmv: user.crmv,
  }
}

export class UserController {
  constructor(
    private readonly registerUser: RegisterUser,
    private readonly getUserProfile: GetUserProfile,
    private readonly activateCrmvUseCase: ActivateCrmv,
  ) {}

  register = async (req: Request, res: Response) => {
    const { name, email, password, type, crmv } = req.body

    const result = await this.registerUser.execute({
      name,
      email,
      password,
      type,
      crmv,
    })

    if (result.isLeft()) {
      return sendDomainError(res, result.value)
    }

    return res.status(201).json(toHttp(result.value))
  }

  me = async (_req: Request, res: Response<unknown, AuthLocals>) => {
    const result = await this.getUserProfile.execute({
      userId: res.locals.userId,
    })

    if (result.isLeft()) {
      return sendDomainError(res, result.value)
    }

    return res.status(200).json(toHttp(result.value))
  }

  activateCrmv = async (req: Request, res: Response<unknown, AuthLocals>) => {
    const result = await this.activateCrmvUseCase.execute({
      userId: res.locals.userId,
      crmv: req.body.crmv,
    })

    if (result.isLeft()) {
      return sendDomainError(res, result.value)
    }

    return res.status(200).json(toHttp(result.value))
  }
}
