import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { DomainError } from '../../../shared/errors/domain-error.ts';
import type { AuthenticateUser } from '../application/authenticate-user.usecase.ts';
import type { RegisterUser } from '../application/register-user.usecase.ts';

const STATUS_BY_ERROR_CODE: Record<string, number> = {
  EMAIL_ALREADY_IN_USE: 409,
  CRMV_REQUIRED_FOR_PROFESSIONAL: 422,
  INVALID_CRMV_FORMAT: 422,
  INVALID_CREDENTIALS: 401,
};

function sendDomainError(res: Response, error: DomainError) {
  const status = STATUS_BY_ERROR_CODE[error.code] ?? 400;
  return res.status(status).json({ code: error.code, message: error.message });
}

export class UserController {
  constructor(
    private readonly registerUser: RegisterUser,
    private readonly authenticateUser: AuthenticateUser,
  ) {}

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

  authenticate = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const result = await this.authenticateUser.execute({ email, password });

    if (result.isLeft()) return sendDomainError(res, result.value);

    const user = result.value;

    const token = jwt.sign(
      { sub: user.id, type: user.type },
      process.env.JWT_SECRET as string,
      { expiresIn: 60 * 60 * 24 },
    );

    return res.json({ token });
  };
}
