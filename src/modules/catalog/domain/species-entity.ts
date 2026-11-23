import type { BodyConditionScale } from './body-condition-scale.ts'

type RestoreSpeciesProps = {
  id: string
  name: string
  bodyConditionScale: BodyConditionScale
}

export class Species {
  private constructor(
    readonly id: string,
    readonly name: string,
    readonly bodyConditionScale: BodyConditionScale,
  ) {}

  static restore(props: RestoreSpeciesProps): Species {
    return new Species(props.id, props.name, props.bodyConditionScale)
  }
}
