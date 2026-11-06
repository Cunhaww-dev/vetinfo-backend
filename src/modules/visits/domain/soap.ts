// undefined = não mexer no campo. null ou "" = apagar o campo.
export type SoapInput = {
  subjective?: string | null | undefined
  objective?: string | null | undefined
  assessment?: string | null | undefined
  plan?: string | null | undefined
}

type SoapProps = {
  subjective: string | null
  objective: string | null
  assessment: string | null
  plan: string | null
}

function clean(value: string | null | undefined): string | null {
  return value?.trim() || null
}

// Value object: as 4 partes do SOAP, em texto livre. O veterinário pode preencher aos poucos.
export class Soap {
  private constructor(
    readonly subjective: string | null, // S: o que o tutor conta (queixa, histórico)
    readonly objective: string | null, // O: o que o veterinário examina e mede
    readonly assessment: string | null, // A: a avaliação, o diagnóstico
    readonly plan: string | null, // P: o plano (tratamento, exames, retorno)
  ) {}

  static create(input: SoapInput = {}): Soap {
    return new Soap(
      clean(input.subjective),
      clean(input.objective),
      clean(input.assessment),
      clean(input.plan),
    )
  }

  change(changes: SoapInput): Soap {
    return new Soap(
      changes.subjective === undefined
        ? this.subjective
        : clean(changes.subjective),
      changes.objective === undefined
        ? this.objective
        : clean(changes.objective),
      changes.assessment === undefined
        ? this.assessment
        : clean(changes.assessment),
      changes.plan === undefined ? this.plan : clean(changes.plan),
    )
  }

  static restore(props: SoapProps): Soap {
    return new Soap(
      props.subjective,
      props.objective,
      props.assessment,
      props.plan,
    )
  }
}
