import type { CatalogRepository } from '../domain/catalog-repository.ts'
import type { Species } from '../domain/species-entity.ts'

export class ListSpecies {
  constructor(private readonly catalog: CatalogRepository) {}

  async execute(): Promise<Species[]> {
    return this.catalog.listSpecies()
  }
}
