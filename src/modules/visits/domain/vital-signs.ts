import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import { InvalidVitalSigns } from './errors/invalid-vital-signs.ts'

// undefined = não mexer no campo. null = apagar o campo.
export type VitalSignsInput = {
  weightKg?: number | null | undefined
  temperatureC?: number | null | undefined
  heartRate?: number | null | undefined
  respiratoryRate?: number | null | undefined
}

type VitalSignsProps = {
  weightKg: number | null
  temperatureC: number | null
  heartRate: number | null
  respiratoryRate: number | null
}

// Faixas largas de propósito. Só barram erro de digitação (ex.: 380 °C no lugar de 38,0).
const LIMITS: Record<keyof VitalSignsProps, { min: number; max: number }> = {
  weightKg: { min: 0.01, max: 2000 },
  temperatureC: { min: 25, max: 45 },
  heartRate: { min: 1, max: 400 },
  respiratoryRate: { min: 1, max: 200 },
}

// Value object: o conjunto de sinais vitais medidos no atendimento. Todos são opcionais.
export class VitalSigns {
  private constructor(
    readonly weightKg: number | null,
    readonly temperatureC: number | null,
    readonly heartRate: number | null,
    readonly respiratoryRate: number | null,
  ) {}

  static create(input: VitalSignsInput = {}): Either<DomainError, VitalSigns> {
    const props: VitalSignsProps = {
      weightKg: input.weightKg ?? null,
      temperatureC: input.temperatureC ?? null,
      heartRate: input.heartRate ?? null,
      respiratoryRate: input.respiratoryRate ?? null,
    }

    for (const field of Object.keys(LIMITS) as (keyof VitalSignsProps)[]) {
      const value = props[field]
      const { min, max } = LIMITS[field]
      if (value !== null && (value < min || value > max))
        return left(new InvalidVitalSigns(field, value))
    }

    return right(VitalSigns.restore(props))
  }

  // Junta o que mudou com o que já existe e valida tudo de novo
  change(changes: VitalSignsInput): Either<DomainError, VitalSigns> {
    return VitalSigns.create({
      weightKg:
        changes.weightKg === undefined ? this.weightKg : changes.weightKg,
      temperatureC:
        changes.temperatureC === undefined
          ? this.temperatureC
          : changes.temperatureC,
      heartRate:
        changes.heartRate === undefined ? this.heartRate : changes.heartRate,
      respiratoryRate:
        changes.respiratoryRate === undefined
          ? this.respiratoryRate
          : changes.respiratoryRate,
    })
  }

  static restore(props: VitalSignsProps): VitalSigns {
    return new VitalSigns(
      props.weightKg,
      props.temperatureC,
      props.heartRate,
      props.respiratoryRate,
    )
  }
}
