import type { Request, Response } from 'express'
import type { ListBreeds } from '../application/list-breeds.usecase.ts'
import type { ListSpecies } from '../application/list-species.usecase.ts'
import type { Breed } from '../domain/breed-entity.ts'
import type { Species } from '../domain/species-entity.ts'

function toHttpSpecies(species: Species) {
  return {
    id: species.id,
    name: species.name,
  }
}

function toHttpBreed(breed: Breed) {
  return {
    id: breed.id,
    name: breed.name,
  }
}

export class CatalogController {
  constructor(
    private readonly listSpeciesUseCase: ListSpecies,
    private readonly listBreedsUseCase: ListBreeds,
  ) {}

  listSpecies = async (_req: Request, res: Response) => {
    const result = await this.listSpeciesUseCase.execute()

    return res.status(200).json(result.map(toHttpSpecies))
  }

  listBreeds = async (req: Request<{ speciesId: string }>, res: Response) => {
    const result = await this.listBreedsUseCase.execute({
      speciesId: req.params.speciesId,
    })

    // O erro segue para o errorHandler, que escolhe o status pelo type
    if (result.isLeft()) throw result.value

    return res.status(200).json(result.value.map(toHttpBreed))
  }
}
