import type { Breed } from './breed-entity.ts'
import type { Species } from './species-entity.ts'

export interface CatalogRepository {
  findSpecieById(id: string): Promise<Species | null>
  listSpecie(): Promise<Species[]>
  listBreed(specieId: string): Promise<Breed[]>
}
