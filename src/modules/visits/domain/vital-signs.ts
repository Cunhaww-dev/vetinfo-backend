import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import {
  type BodyConditionScale,
  isValidScore,
} from '../../catalog/domain/body-condition-scale.ts'
import { InvalidVitalSigns } from './errors/invalid-vital-signs.ts'

// undefined = não mexer no campo. null = apagar o campo.
export type VitalSignsInput = {
  weightKg?: number | null | undefined
  temperatureC?: number | null | undefined
  heartRate?: number | null | undefined
  respiratoryRate?: number | null | undefined
  bodyConditionScore?: number | null | undefined
}

type MeasuredSigns = {
  weightKg: number | null
  temperatureC: number | null
  heartRate: number | null
  respiratoryRate: number | null
}

type VitalSignsProps = MeasuredSigns & {
  bodyConditionScore: number | null
  // A escala do escore. null quando não tem escore.
  bodyConditionScale: BodyConditionScale | null
}

// Faixas largas de propósito. Só barram erro de digitação (ex.: 380 °C no lugar de 38,0).
// O escore não está aqui: a faixa dele depende da escala da espécie.
const LIMITS: Record<keyof MeasuredSigns, { min: number; max: number }> = {
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
    readonly bodyConditionScore: number | null, // escore corporal
    readonly bodyConditionScale: BodyConditionScale | null,
  ) {}

  // A escala vem da espécie do paciente, nunca do cliente
  static create(
    input: VitalSignsInput = {},
    speciesScale: BodyConditionScale,
  ): Either<DomainError, VitalSigns> {
    const score = input.bodyConditionScore ?? null
    const props: VitalSignsProps = {
      weightKg: input.weightKg ?? null,
      temperatureC: input.temperatureC ?? null,
      heartRate: input.heartRate ?? null,
      respiratoryRate: input.respiratoryRate ?? null,
      bodyConditionScore: score,
      bodyConditionScale: score === null ? null : speciesScale,
    }

    for (const field of Object.keys(LIMITS) as (keyof MeasuredSigns)[]) {
      const value = props[field]
      const { min, max } = LIMITS[field]
      if (value !== null && (value < min || value > max))
        return left(new InvalidVitalSigns(field, value))
    }

    if (score !== null && !isValidScore(score, speciesScale))
      return left(new InvalidVitalSigns('bodyConditionScore', score))

    return right(VitalSigns.restore(props))
  }

  // Junta o que mudou com o que já existe e valida tudo de novo.
  // Escore novo usa a escala de hoje da espécie. Escore sem mudança fica com a escala dele.
  change(
    changes: VitalSignsInput,
    speciesScale: BodyConditionScale,
  ): Either<DomainError, VitalSigns> {
    const scale =
      changes.bodyConditionScore === undefined && this.bodyConditionScale
        ? this.bodyConditionScale
        : speciesScale
    return VitalSigns.create(
      {
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
        bodyConditionScore:
          changes.bodyConditionScore === undefined
            ? this.bodyConditionScore
            : changes.bodyConditionScore,
      },
      scale,
    )
  }

  static restore(props: VitalSignsProps): VitalSigns {
    return new VitalSigns(
      props.weightKg,
      props.temperatureC,
      props.heartRate,
      props.respiratoryRate,
      props.bodyConditionScore,
      props.bodyConditionScale,
    )
  }
}
