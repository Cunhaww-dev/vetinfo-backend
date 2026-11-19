import { randomUUID } from 'node:crypto'
import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { InvalidVaccineDates } from './errors/invalid-vaccine-dates.ts'

type CreateVaccineInput = {
  userId: string
  patientId: string
  visitId?: string | null | undefined
  patientBirthDate: Date
  name: string
  appliedAt: Date
  nextDoseAt?: Date | null | undefined
  manufacturer?: string | null | undefined
  batch?: string | null | undefined
  notes?: string | null | undefined
}

// undefined = não mexer no campo. null = apagar o campo.
export type UpdateVaccineInput = {
  name?: string | undefined
  appliedAt?: Date | undefined
  nextDoseAt?: Date | null | undefined
  manufacturer?: string | null | undefined
  batch?: string | null | undefined
  notes?: string | null | undefined
}

type RestoreVaccineProps = {
  id: string
  userId: string
  patientId: string
  visitId: string | null
  name: string
  appliedAt: Date
  nextDoseAt: Date | null
  manufacturer: string | null
  batch: string | null
  notes: string | null
  createdAt: Date
}

const optionalText = (value: string | null | undefined) => value?.trim() || null

// Confere as 3 regras de data. Devolve o motivo do erro, ou null quando está tudo certo.
function checkDates(
  appliedAt: Date,
  nextDoseAt: Date | null,
  birthDate: Date,
): string | null {
  if (appliedAt.getTime() > Date.now()) return 'applied date is in the future'
  if (appliedAt.getTime() < birthDate.getTime())
    return 'applied date is before the patient birth date'
  if (nextDoseAt && nextDoseAt.getTime() <= appliedAt.getTime())
    return 'next dose must be after the applied date'
  return null
}

// Vacina aplicada no paciente. O atendimento é opcional (vacina de histórico antigo).
export class Vaccine {
  private constructor(
    readonly id: string,
    readonly userId: string,
    readonly patientId: string,
    readonly visitId: string | null, // null = registrada sem atendimento
    readonly name: string,
    readonly appliedAt: Date,
    readonly nextDoseAt: Date | null, // a próxima dose, para o lembrete
    readonly manufacturer: string | null,
    readonly batch: string | null, // lote
    readonly notes: string | null,
    readonly createdAt: Date,
  ) {}

  static create(input: CreateVaccineInput): Either<DomainError, Vaccine> {
    const nextDoseAt = input.nextDoseAt ?? null
    const invalid = checkDates(
      input.appliedAt,
      nextDoseAt,
      input.patientBirthDate,
    )
    if (invalid) return left(new InvalidVaccineDates(invalid))

    return right(
      new Vaccine(
        randomUUID(),
        input.userId,
        input.patientId,
        input.visitId ?? null,
        input.name.trim(),
        input.appliedAt,
        nextDoseAt,
        optionalText(input.manufacturer),
        optionalText(input.batch),
        optionalText(input.notes),
        new Date(),
      ),
    )
  }

  update(
    changes: UpdateVaccineInput,
    patientBirthDate: Date,
  ): Either<DomainError, Vaccine> {
    const appliedAt = changes.appliedAt ?? this.appliedAt
    const nextDoseAt =
      changes.nextDoseAt === undefined ? this.nextDoseAt : changes.nextDoseAt
    const invalid = checkDates(appliedAt, nextDoseAt, patientBirthDate)
    if (invalid) return left(new InvalidVaccineDates(invalid))

    const keepOr = (
      value: string | null | undefined,
      current: string | null,
    ) => (value === undefined ? current : optionalText(value))

    return right(
      new Vaccine(
        this.id,
        this.userId,
        this.patientId, // o paciente e o atendimento nunca mudam
        this.visitId,
        changes.name?.trim() ?? this.name,
        appliedAt,
        nextDoseAt,
        keepOr(changes.manufacturer, this.manufacturer),
        keepOr(changes.batch, this.batch),
        keepOr(changes.notes, this.notes),
        this.createdAt,
      ),
    )
  }

  static restore(props: RestoreVaccineProps): Vaccine {
    return new Vaccine(
      props.id,
      props.userId,
      props.patientId,
      props.visitId,
      props.name,
      props.appliedAt,
      props.nextDoseAt,
      props.manufacturer,
      props.batch,
      props.notes,
      props.createdAt,
    )
  }
}
