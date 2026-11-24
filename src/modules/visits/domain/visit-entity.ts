import { randomUUID } from 'node:crypto'
import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import type { BodyConditionScale } from '../../catalog/domain/body-condition-scale.ts'
import type { UserType } from '../../users/domain/user-entity.ts'
import { InvalidVisitDate } from './errors/invalid-visit-date.ts'
import { VaccinationVisitHasNoSoap } from './errors/vaccination-visit-has-no-soap.ts'
import { VisitBeforeBirth } from './errors/visit-before-birth.ts'
import { Soap, type SoapInput } from './soap.ts'
import type { VisitPatient } from './visit-repository.ts'
import { VitalSigns, type VitalSignsInput } from './vital-signs.ts'

// Consulta tem SOAP. Vacinação não: o que o vet anota fica na própria vacina.
export type VisitType = 'consultation' | 'vaccination'

type CreateVisitInput = {
  userId: string
  patientId: string
  authorType: UserType
  // Sem o tipo, é consulta
  type?: VisitType | undefined
  patientBirthDate: Date | null
  // A escala do escore corporal da espécie do paciente
  bodyConditionScale: BodyConditionScale
  visitedAt?: Date | undefined
  vitalSigns?: VitalSignsInput | undefined
  soap?: SoapInput | undefined
}

// Não tem userId, patientId, authorType nem type: esses campos nunca mudam
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
  type: VisitType
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
// No atendimento de vacinação, o SOAP existe, mas fica sempre vazio.
export class Visit {
  private constructor(
    readonly id: string,
    readonly userId: string, // o autor do atendimento e o escopo
    readonly patientId: string,
    readonly authorType: UserType, // snapshot: o tipo do autor no momento da criação
    readonly type: VisitType, // nunca muda
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

    const vitalSigns = VitalSigns.create(
      input.vitalSigns,
      input.bodyConditionScale,
    )
    if (vitalSigns.isLeft()) return left(vitalSigns.value)

    const type = input.type ?? 'consultation'
    const soap = Soap.create(input.soap)
    if (type === 'vaccination' && !soap.isEmpty())
      return left(new VaccinationVisitHasNoSoap())

    return right(
      new Visit(
        randomUUID(),
        input.userId,
        input.patientId,
        input.authorType,
        type,
        visitedAt,
        vitalSigns.value,
        soap,
        new Date(),
      ),
    )
  }

  update(
    changes: UpdateVisitInput,
    patient: VisitPatient,
  ): Either<DomainError, Visit> {
    const patientBirthDate = patient.birthDate
    const visitedAt = changes.visitedAt ?? this.visitedAt
    if (isInTheFuture(visitedAt)) return left(new InvalidVisitDate())

    // Só confere quando a data muda. Editar o SOAP de um atendimento antigo sempre funciona
    if (changes.visitedAt && isBeforeBirth(visitedAt, patientBirthDate))
      return left(new VisitBeforeBirth())

    const vitalSigns: Either<DomainError, VitalSigns> = changes.vitalSigns
      ? this.vitalSigns.change(changes.vitalSigns, patient.bodyConditionScale)
      : right(this.vitalSigns)
    if (vitalSigns.isLeft()) return left(vitalSigns.value)

    const soap = changes.soap ? this.soap.change(changes.soap) : this.soap
    if (this.type === 'vaccination' && !soap.isEmpty())
      return left(new VaccinationVisitHasNoSoap())

    return right(
      new Visit(
        this.id,
        this.userId,
        this.patientId,
        this.authorType, // o snapshot passa adiante sem mudar
        this.type,
        visitedAt,
        vitalSigns.value,
        soap,
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
      props.type,
      props.visitedAt,
      props.vitalSigns,
      props.soap,
      props.createdAt,
    )
  }
}
