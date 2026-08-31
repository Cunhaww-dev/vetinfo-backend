import { type Either, left, right } from '../../../shared/either/either.ts';
import type { DomainError } from '../../../shared/errors/domain-error.ts';
import { InvalidCredentials } from '../domain/errors/invalid-credentials.ts';
import type { HashProvider } from '../domain/hash-provider.ts';
import type { User } from '../domain/user.entity.ts';
import type { UserRepository } from '../domain/user.repository.ts';

type AuthenticateUserInput = {
  email: string;
  password: string;
};

export class AuthenticateUser {
  constructor(
    private readonly users: UserRepository,
    private readonly hashProvider: HashProvider,
  ) {}

  async execute(
    input: AuthenticateUserInput,
  ): Promise<Either<DomainError, User>> {
    const user = await this.users.findByEmail(input.email.trim().toLowerCase());

    if (!user) return left(new InvalidCredentials());

    const matches = await this.hashProvider.compare(
      input.password,
      user.passwordHash,
    );

    if (!matches) return left(new InvalidCredentials());

    return right(user);
  }
}
