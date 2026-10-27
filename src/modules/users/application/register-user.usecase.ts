import { type Either, left, right } from '../../../shared/either/either.ts';
import type { DomainError } from '../../../shared/errors/domain-error.ts';
import type { AuthProvider } from '../domain/auth-provider.ts';
import { EmailAlreadyInUse } from '../domain/errors/email-already-in-use.ts';
import { User, type UserType } from '../domain/user-entity.ts';
import type { UserRepository } from '../domain/user-repository.ts';

type RegisterUserInput = {
  name: string;
  email: string;
  password: string;
  type: UserType;
  crmv?: string;
};

export class RegisterUser {
  constructor(
    private readonly users: UserRepository,
    private readonly authProvider: AuthProvider,
  ) {}

  async execute(input: RegisterUserInput): Promise<Either<DomainError, User>> {
    const email = input.email.trim().toLowerCase();

    const existing = await this.users.findByEmail(email);
    if (existing) return left(new EmailAlreadyInUse(email));

    const result = User.create({
      name: input.name,
      email,
      type: input.type,
      crmv: input.crmv ?? null,
    });
    if (result.isLeft()) return left(result.value);

    const user = await this.authProvider.signUp(result.value, input.password);

    return right(user);
  }
}
