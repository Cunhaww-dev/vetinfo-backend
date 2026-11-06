import type {
  Breed as BreedRow,
  PrismaClient,
  Species as SpeciesRow,
} from '../../../generated/prisma/client.ts'
import { Breed } from '../domain/breed-entity.ts'
import type { CatalogRepository } from '../domain/catalog-repository.ts'
import { Species } from '../domain/species-entity.ts'

export class PrismaCatalogRepository implements CatalogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findSpeciesById(id: string): Promise<Species | null> {
    const row = await this.prisma.species.findUnique({
      where: { id },
    })
    return row ? this.toSpecies(row) : null
  }

  async listSpecies(): Promise<Species[]> {
    const rows = await this.prisma.species.findMany({
      orderBy: { name: 'asc' },
    })
    return rows.map((row) => this.toSpecies(row))
  }

  async listBreeds(speciesId: string): Promise<Breed[]> {
    const rows = await this.prisma.breed.findMany({
      where: { speciesId },
      orderBy: { name: 'asc' },
    })
    return rows.map((row) => this.toBreed(row))
  }

  private toSpecies(row: SpeciesRow): Species {
    return Species.restore({ id: row.id, name: row.name })
  }

  private toBreed(row: BreedRow): Breed {
    return Breed.restore({
      id: row.id,
      name: row.name,
      speciesId: row.speciesId,
    })
  }
}
