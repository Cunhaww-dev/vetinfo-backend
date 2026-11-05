import type { Breed } from './breed-entity.ts'
import type { Species } from './species-entity.ts'

export interface CatalogRepository {
  findSpeciesById(id: string): Promise<Species | null>
  listSpecies(): Promise<Species[]>
  listBreed(speciesId: string): Promise<Breed[]>
}
