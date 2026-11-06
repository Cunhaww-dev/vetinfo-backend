type RestoreBreedProps = {
  id: string
  name: string
  speciesId: string
}

export class Breed {
  private constructor(
    readonly id: string,
    readonly name: string,
    readonly speciesId: string,
  ) {}

  static restore(props: RestoreBreedProps): Breed {
    return new Breed(props.id, props.name, props.speciesId)
  }
}
