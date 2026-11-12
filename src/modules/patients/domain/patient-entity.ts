import { randomUUID } from 'node:crypto'
import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { InvalidBirthDate } from './errors/invalid-birth-date.ts'

export type PatientSex = 'male' | 'female'

// A raça com a espécie, como o catálogo guarda. Os nomes vão para a tela.
export type PatientBreed = {
  id: string
  name: string
  species: { id: string; name: string }
}

type CreatePatientInput = {
  userId: string
  guardianId?: string | null | undefined
  breed: PatientBreed
  name: string
  sex: PatientSex
  neutered?: boolean | undefined
  coatColor?: string | null | undefined
  birthDate?: Date | null | undefined
  microchip?: string | null | undefined
}

// undefined = não mexer no campo. null = apagar o campo.
export type UpdatePatientInput = {
  guardianId?: string | null | undefined
  breed?: PatientBreed | undefined
  name?: string | undefined
  sex?: PatientSex | undefined
  neutered?: boolean | undefined
  coatColor?: string | null | undefined
  birthDate?: Date | null | undefined
  microchip?: string | null | undefined
}

type RestorePatientProps = {
  id: string
  userId: string
  guardianId: string | null
  breed: PatientBreed
  name: string
  sex: PatientSex
  neutered: boolean
  coatColor: string | null
  birthDate: Date | null
  microchip: string | null
  createdAt: Date
}

function isInTheFuture(date: Date | null): boolean {
  return date !== null && date.getTime() > Date.now()
}

// A espécie não mora aqui. Ela vem pela raça, como o DER manda.
export class Patient {
  private constructor(
    readonly id: string,
    readonly userId: string, // o usuário dono do registro (escopo)
    readonly guardianId: string | null, // null = paciente sem tutor (ONG, resgate)
    readonly breed: PatientBreed,
    readonly name: string,
    readonly sex: PatientSex,
    readonly neutered: boolean,
    readonly coatColor: string | null,
    readonly birthDate: Date | null,
    readonly microchip: string | null,
    readonly createdAt: Date,
  ) {}

  static create(input: CreatePatientInput): Either<DomainError, Patient> {
    const birthDate = input.birthDate ?? null
    if (isInTheFuture(birthDate)) return left(new InvalidBirthDate())

    return right(
      new Patient(
        randomUUID(),
        input.userId,
        input.guardianId ?? null,
        input.breed,
        input.name.trim(),
        input.sex,
        input.neutered ?? false,
        input.coatColor?.trim() || null,
        birthDate,
        input.microchip?.trim() || null,
        new Date(),
      ),
    )
  }

  update(changes: UpdatePatientInput): Either<DomainError, Patient> {
    const birthDate =
      changes.birthDate === undefined ? this.birthDate : changes.birthDate
    if (isInTheFuture(birthDate)) return left(new InvalidBirthDate())

    return right(
      new Patient(
        this.id,
        this.userId,
        changes.guardianId === undefined ? this.guardianId : changes.guardianId,
        changes.breed ?? this.breed,
        changes.name?.trim() ?? this.name,
        changes.sex ?? this.sex,
        changes.neutered ?? this.neutered,
        changes.coatColor === undefined
          ? this.coatColor
          : changes.coatColor?.trim() || null,
        birthDate,
        changes.microchip === undefined
          ? this.microchip
          : changes.microchip?.trim() || null,
        this.createdAt,
      ),
    )
  }

  static restore(props: RestorePatientProps): Patient {
    return new Patient(
      props.id,
      props.userId,
      props.guardianId,
      props.breed,
      props.name,
      props.sex,
      props.neutered,
      props.coatColor,
      props.birthDate,
      props.microchip,
      props.createdAt,
    )
  }
}
