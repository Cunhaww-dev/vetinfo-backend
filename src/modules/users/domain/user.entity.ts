import { randomUUID } from 'node:crypto';
import { type Either, left, right } from '../../../shared/either/either.ts';
import type { DomainError } from '../../../shared/errors/domain-error.ts';
import { CrmvRequiredForProfessional } from './errors/crmv-required-for-professional.ts';
import { InvalidCrmvFormat } from './errors/invalid-crmv-format.ts';

export type UserType = 'professional' | 'student';

type CreateUserInput = {
  name: string;
  email: string;
  passwordHash: string;
  type: UserType;
  crmv?: string | null;
};

type RestoreUserProps = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  type: UserType;
  crmv: string | null;
  createdAt: Date;
  crmvActivatedAt: Date | null;
};

const CRMV_FORMAT = /^[A-Z]{2}\d+$/;

export class User {
  private constructor(
    readonly id: string,
    readonly name: string,
    readonly email: string,
    readonly passwordHash: string,
    readonly type: UserType,
    readonly crmv: string | null,
    readonly createdAt: Date,
    readonly crmvActivatedAt: Date | null,
  ) {}

  // O create é pra criar um usuário. E o restore pega esse usuário do banco monta o JSON em domínio e utiliza na aplicação. Eles são statics pq o constructor é private, assim só quem esta dentro da classe consegue chamar o new User.
  static create(input: CreateUserInput): Either<DomainError, User> {
    const crmv = input.crmv?.trim().toUpperCase() ?? null;

    if (input.type === 'professional') {
      if (!crmv) return left(new CrmvRequiredForProfessional());
      if (!CRMV_FORMAT.test(crmv)) return left(new InvalidCrmvFormat(crmv));
    }

    const now = new Date();

    return right(
      new User(
        randomUUID(),
        input.name,
        input.email.trim().toLowerCase(),
        input.passwordHash,
        input.type,
        input.type === 'professional' ? crmv : null,
        now,
        input.type === 'professional' ? now : null,
      ),
    );
  }

  static restore(props: RestoreUserProps): User {
   return new User(
      props.id,
      props.name,
      props.email,
      props.passwordHash,
      props.type,
      props.crmv,
      props.createdAt,
      props.crmvActivatedAt,
    );
  }
}
