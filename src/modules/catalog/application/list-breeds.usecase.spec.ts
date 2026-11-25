import { describe, expect, it } from 'vitest'
import { Breed } from '../domain/breed-entity.ts'
import type { CatalogRepository } from '../domain/catalog-repository.ts'
import { Species } from '../domain/species-entity.ts'
import { ListBreeds } from './list-breeds.usecase.ts'

const dog = Species.restore({
  id: 'dog',
  name: 'Cão',
  bodyConditionScale: '1-9',
})
const breed = (name: string) =>
  Breed.restore({ id: name, name, speciesId: dog.id })

// O banco devolve em ordem alfabética: o SRD fica no meio da lista
const catalog: CatalogRepository = {
  findSpeciesById: async (id) => (id === dog.id ? dog : null),
  listSpecies: async () => [dog],
  listBreeds: async () => [breed('Beagle'), breed('SRD'), breed('Shih Tzu')],
}

describe('ListBreeds', () => {
  it('o SRD vem primeiro, e o resto mantém a ordem', async () => {
    const result = await new ListBreeds(catalog).execute({ speciesId: 'dog' })

    expect((result.value as Breed[]).map(({ name }) => name)).toEqual([
      'SRD',
      'Beagle',
      'Shih Tzu',
    ])
  })

  it('espécie sem SRD: a lista vem como está', async () => {
    const noDefault: CatalogRepository = {
      ...catalog,
      listBreeds: async () => [breed('Beagle'), breed('Poodle')],
    }

    const result = await new ListBreeds(noDefault).execute({ speciesId: 'dog' })

    expect((result.value as Breed[]).map(({ name }) => name)).toEqual([
      'Beagle',
      'Poodle',
    ])
  })

  it('espécie que não existe vira SPECIES_NOT_FOUND', async () => {
    const result = await new ListBreeds(catalog).execute({ speciesId: 'cat' })

    expect(result.value).toMatchObject({ code: 'SPECIES_NOT_FOUND' })
  })
})
