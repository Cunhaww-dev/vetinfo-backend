import { left, right, type Either } from '../../../shared/either/either.ts';
import type { DomainError } from '../../../shared/errors/domain-error.ts';
import { UserNotFound } from '../domain/errors/user-not-found.ts';
import { User } from '../domain/user-entity.ts';
import type { UserRepository } from '../domain/user-repository.ts';

type ActivateCrmvInput = {
  userId: string;
  crmv: string;
};

export class ActivateCrmv {
  constructor(private readonly users: UserRepository) {}

  async execute(input: ActivateCrmvInput): Promise<Either<DomainError, User>> {
    const user = await this.users.findById(input.userId);
    if (!user) return left(new UserNotFound(input.userId));

    const result = user.activateCrmv(input.crmv);
    if (result.isLeft()) return left(result.value);

    const activated = result.value;
    await this.users.update(activated);

    return right(activated);
  }
}
