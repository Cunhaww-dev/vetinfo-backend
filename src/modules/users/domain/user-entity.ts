import { randomUUID } from 'node:crypto'
import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { CrmvRequiredForProfessional } from './errors/crmv-required-for-professional.ts'
import { CrmvAlreadyActivated } from './errors/crmv-already-activated.ts'
import { InvalidCrmvFormat } from './errors/invalid-crmv-format.ts'

export type UserType = 'professional' | 'student'

type CreateUserInput = {
  name: string
  email: string
  type: UserType
  crmv?: string | null
}

type RestoreUserProps = {
  id: string
  name: string
  email: string
  type: UserType
  crmv: string | null
  createdAt: Date
  crmvActivatedAt: Date | null
}

// UF + 1 a 6 números (Resolução CFMV 1.475/2022). O "S" no fim é a inscrição secundária,
// em outro estado. O zootecnista ("/Z") não entra: ele não é médico-veterinário.
const UFS =
  'AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO'
const CRMV_FORMAT = new RegExp(`^(${UFS})\\d{1,6}S?$`)

export class User {
  private constructor(
    readonly id: string,
    readonly name: string,
    readonly email: string,
    readonly type: UserType,
    readonly crmv: string | null,
    readonly createdAt: Date,
    readonly crmvActivatedAt: Date | null,
  ) {}

  // O create é pra criar um usuário. E o restore pega esse usuário do banco monta o JSON em domínio e utiliza na aplicação. Eles são statics pq o constructor é private, assim só quem esta dentro da classe consegue chamar o new User.
  static create(input: CreateUserInput): Either<DomainError, User> {
    const crmv = input.crmv?.trim().toUpperCase() ?? null

    if (input.type === 'professional') {
      if (!crmv) return left(new CrmvRequiredForProfessional())
      if (!CRMV_FORMAT.test(crmv)) return left(new InvalidCrmvFormat(crmv))
    }

    const now = new Date()

    return right(
      new User(
        randomUUID(),
        input.name,
        input.email.trim().toLowerCase(),
        input.type,
        input.type === 'professional' ? crmv : null,
        now,
        input.type === 'professional' ? now : null,
      ),
    )
  }

  activateCrmv(crmv: string): Either<DomainError, User> {
    if (this.type === 'professional') return left(new CrmvAlreadyActivated())

    const normalized = crmv.trim().toUpperCase()
    if (!CRMV_FORMAT.test(normalized))
      return left(new InvalidCrmvFormat(normalized))

    return right(
      new User(
        this.id,
        this.name,
        this.email,
        'professional',
        normalized,
        this.createdAt,
        new Date(),
      ),
    )
  }

  static restore(props: RestoreUserProps): User {
    return new User(
      props.id,
      props.name,
      props.email,
      props.type,
      props.crmv,
      props.createdAt,
      props.crmvActivatedAt,
    )
  }
}
