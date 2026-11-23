import { randomUUID } from 'node:crypto'
import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { InvalidMedicationDates } from './errors/invalid-medication-dates.ts'

export const MEDICATION_ROUTES = [
  'oral',
  'topical',
  'subcutaneous',
  'intramuscular',
  'intravenous',
  'ophthalmic',
  'otic',
  'rectal',
  'inhalation',
  // Decisão de 23/11/2026: 4 vias a mais, e o "other" continua
  'intranasal',
  'transdermal',
  'intraocular',
  'intraarticular',
  'other',
] as const

export type MedicationRoute = (typeof MEDICATION_ROUTES)[number]

type CreateMedicationInput = {
  userId: string
  visitId: string
  name: string
  dosage: string
  frequency: string
  route: MedicationRoute
  startDate: Date
  endDate?: Date | null | undefined
  continuousUse?: boolean | undefined
  notes?: string | null | undefined
}

// undefined = não mexer no campo. null = apagar o campo.
export type UpdateMedicationInput = {
  name?: string | undefined
  dosage?: string | undefined
  frequency?: string | undefined
  route?: MedicationRoute | undefined
  startDate?: Date | undefined
  endDate?: Date | null | undefined
  continuousUse?: boolean | undefined
  notes?: string | null | undefined
}

type RestoreMedicationProps = {
  id: string
  userId: string
  visitId: string
  name: string
  dosage: string
  frequency: string
  route: MedicationRoute
  startDate: Date
  endDate: Date | null
  continuousUse: boolean
  notes: string | null
  createdAt: Date
}

function endsBeforeStart(startDate: Date, endDate: Date | null): boolean {
  return endDate !== null && endDate.getTime() < startDate.getTime()
}

// Hoje à meia-noite (UTC), no mesmo formato das datas @db.Date
function today(): Date {
  return new Date(new Date().toISOString().slice(0, 10))
}

// Medicação prescrita num atendimento. Ela nasce do atendimento e pertence ao mesmo usuário.
export class Medication {
  private constructor(
    readonly id: string,
    readonly userId: string,
    readonly visitId: string,
    readonly name: string,
    readonly dosage: string, // texto livre: "10 mg/kg"
    readonly frequency: string, // texto livre: "a cada 12 horas"
    readonly route: MedicationRoute, // via de administração
    readonly startDate: Date,
    readonly endDate: Date | null, // null = sem data para acabar
    readonly continuousUse: boolean,
    readonly notes: string | null,
    readonly createdAt: Date,
  ) {}

  // Ativa = ainda não chegou na data de término (ou não tem término)
  get active(): boolean {
    return this.endDate === null || this.endDate.getTime() >= today().getTime()
  }

  static create(input: CreateMedicationInput): Either<DomainError, Medication> {
    const endDate = input.endDate ?? null
    if (endsBeforeStart(input.startDate, endDate))
      return left(new InvalidMedicationDates())

    return right(
      new Medication(
        randomUUID(),
        input.userId,
        input.visitId,
        input.name.trim(),
        input.dosage.trim(),
        input.frequency.trim(),
        input.route,
        input.startDate,
        endDate,
        input.continuousUse ?? false,
        input.notes?.trim() || null,
        new Date(),
      ),
    )
  }

  update(changes: UpdateMedicationInput): Either<DomainError, Medication> {
    const startDate = changes.startDate ?? this.startDate
    const endDate =
      changes.endDate === undefined ? this.endDate : changes.endDate
    if (endsBeforeStart(startDate, endDate))
      return left(new InvalidMedicationDates())

    return right(
      new Medication(
        this.id,
        this.userId,
        this.visitId, // a medicação nunca muda de atendimento
        changes.name?.trim() ?? this.name,
        changes.dosage?.trim() ?? this.dosage,
        changes.frequency?.trim() ?? this.frequency,
        changes.route ?? this.route,
        startDate,
        endDate,
        changes.continuousUse ?? this.continuousUse,
        changes.notes === undefined
          ? this.notes
          : changes.notes?.trim() || null,
        this.createdAt,
      ),
    )
  }

  static restore(props: RestoreMedicationProps): Medication {
    return new Medication(
      props.id,
      props.userId,
      props.visitId,
      props.name,
      props.dosage,
      props.frequency,
      props.route,
      props.startDate,
      props.endDate,
      props.continuousUse,
      props.notes,
      props.createdAt,
    )
  }
}
