import { type Either, left, right } from '../../../shared/either/either.ts'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import type { Breed } from '../domain/breed-entity.ts'
import type { CatalogRepository } from '../domain/catalog-repository.ts'
import { SpeciesNotFound } from '../domain/errors/species-not-found.ts'

const DEFAULT_BREED = 'SRD'

type ListBreedsInput = {
  speciesId: string
}

export class ListBreeds {
  constructor(private readonly catalog: CatalogRepository) {}

  async execute(input: ListBreedsInput): Promise<Either<DomainError, Breed[]>> {
    const species = await this.catalog.findSpeciesById(input.speciesId)
    if (!species) return left(new SpeciesNotFound(input.speciesId))

    const breeds = await this.catalog.listBreeds(species.id)

    const defaultBreed = breeds.filter((breed) => breed.name === DEFAULT_BREED)
    const others = breeds.filter((breed) => breed.name !== DEFAULT_BREED)

    return right([...defaultBreed, ...others])
  }
}
