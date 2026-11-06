type RestoreSpeciesProps = {
  id: string
  name: string
}

export class Species {
  private constructor(
    readonly id: string,
    readonly name: string,
  ) {}

  static restore(props: RestoreSpeciesProps): Species {
    return new Species(props.id, props.name)
  }
}
