import type { Request, Response } from 'express'
import type { DomainError } from '../../../shared/errors/domain-error.ts'
import type { ListBreeds } from '../application/list-breeds.usecase.ts'
import type { ListSpecies } from '../application/list-species.usecase.ts'
import type { Breed } from '../domain/breed-entity.ts'
import type { Species } from '../domain/species-entity.ts'

const STATUS_BY_ERROR_CODE: Record<string, number> = {
  SPECIES_NOT_FOUND: 404,
}

function sendDomainError(res: Response, error: DomainError) {
  const status = STATUS_BY_ERROR_CODE[error.code] ?? 400
  return res.status(status).json({ code: error.code, message: error.message })
}

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

    if (result.isLeft()) {
      return sendDomainError(res, result.value)
    }

    return res.status(200).json(result.value.map(toHttpBreed))
  }
}
