import type { Request, Response } from 'express';
import type { DomainError } from '../../../shared/errors/domain-error.ts';
import type { RegisterUser } from '../application/register-user.usecase.ts';

const STATUS_BY_ERROR_CODE: Record<string, number> = {
  EMAIL_ALREADY_IN_USE: 409,
  CRMV_REQUIRED_FOR_PROFESSIONAL: 422,
  INVALID_CRMV_FORMAT: 422,
};

function sendDomainError(res: Response, error: DomainError) {
  const status = STATUS_BY_ERROR_CODE[error.code] ?? 400;
  return res.status(status).json({ code: error.code, message: error.message });
}

export class UserController {
  constructor(private readonly registerUser: RegisterUser) {}

  register = async (req: Request, res: Response) => {
    const { name, email, password, type, crmv } = req.body;

    const result = await this.registerUser.execute({
      name,
      email,
      password,
      type,
      crmv,
    });

    if (result.isLeft()) {
      return sendDomainError(res, result.value);
    }

    const user = result.value;

    return res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      type: user.type,
      crmv: user.crmv,
    });
  };
}
