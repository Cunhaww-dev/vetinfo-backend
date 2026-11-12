import { randomUUID } from 'node:crypto'
import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import type { UserType } from '../../users/domain/user-entity.ts'
import { InvalidVisitDate } from './errors/invalid-visit-date.ts'
import { VisitBeforeBirth } from './errors/visit-before-birth.ts'
import { Soap, type SoapInput } from './soap.ts'
import { VitalSigns, type VitalSignsInput } from './vital-signs.ts'

type CreateVisitInput = {
  userId: string
  patientId: string
  authorType: UserType
  patientBirthDate: Date | null
  visitedAt?: Date | undefined
  vitalSigns?: VitalSignsInput | undefined
  soap?: SoapInput | undefined
}

// Não tem userId, patientId nem authorType: esses campos nunca mudam
export type UpdateVisitInput = {
  visitedAt?: Date | undefined
  vitalSigns?: VitalSignsInput | undefined
  soap?: SoapInput | undefined
}

type RestoreVisitProps = {
  id: string
  userId: string
  patientId: string
  authorType: UserType
  visitedAt: Date
  vitalSigns: VitalSigns
  soap: Soap
  createdAt: Date
}

function isInTheFuture(date: Date): boolean {
  return date.getTime() > Date.now()
}

// Sem nascimento cadastrado, não tem como conferir
function isBeforeBirth(visitedAt: Date, birthDate: Date | null): boolean {
  return birthDate !== null && visitedAt.getTime() < birthDate.getTime()
}

// Atendimento. Todo atendimento tem exatamente um SOAP (DER, regra 5).
export class Visit {
  private constructor(
    readonly id: string,
    readonly userId: string, // o autor do atendimento e o escopo
    readonly patientId: string,
    readonly authorType: UserType, // snapshot: o tipo do autor no momento da criação
    readonly visitedAt: Date,
    readonly vitalSigns: VitalSigns,
    readonly soap: Soap,
    readonly createdAt: Date,
  ) {}

  static create(input: CreateVisitInput): Either<DomainError, Visit> {
    const visitedAt = input.visitedAt ?? new Date()
    if (isInTheFuture(visitedAt)) return left(new InvalidVisitDate())
    if (isBeforeBirth(visitedAt, input.patientBirthDate))
      return left(new VisitBeforeBirth())

    const vitalSigns = VitalSigns.create(input.vitalSigns)
    if (vitalSigns.isLeft()) return left(vitalSigns.value)

    return right(
      new Visit(
        randomUUID(),
        input.userId,
        input.patientId,
        input.authorType,
        visitedAt,
        vitalSigns.value,
        Soap.create(input.soap),
        new Date(),
      ),
    )
  }

  update(
    changes: UpdateVisitInput,
    patientBirthDate: Date | null,
  ): Either<DomainError, Visit> {
    const visitedAt = changes.visitedAt ?? this.visitedAt
    if (isInTheFuture(visitedAt)) return left(new InvalidVisitDate())

    // Só confere quando a data muda. Editar o SOAP de um atendimento antigo sempre funciona
    if (changes.visitedAt && isBeforeBirth(visitedAt, patientBirthDate))
      return left(new VisitBeforeBirth())

    const vitalSigns: Either<DomainError, VitalSigns> = changes.vitalSigns
      ? this.vitalSigns.change(changes.vitalSigns)
      : right(this.vitalSigns)
    if (vitalSigns.isLeft()) return left(vitalSigns.value)

    return right(
      new Visit(
        this.id,
        this.userId,
        this.patientId,
        this.authorType, // o snapshot passa adiante sem mudar
        visitedAt,
        vitalSigns.value,
        changes.soap ? this.soap.change(changes.soap) : this.soap,
        this.createdAt,
      ),
    )
  }

  static restore(props: RestoreVisitProps): Visit {
    return new Visit(
      props.id,
      props.userId,
      props.patientId,
      props.authorType,
      props.visitedAt,
      props.vitalSigns,
      props.soap,
      props.createdAt,
    )
  }
}
