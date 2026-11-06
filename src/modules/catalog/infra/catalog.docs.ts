import { z } from 'zod'
import type { ZodOpenApiPathsObject } from 'zod-openapi'
import {
  error,
  json,
  unauthorized,
  uuid,
} from '../../../shared/docs/responses.ts'

const speciesSchema = z
  .object({ id: uuid, name: z.string().meta({ example: 'Cão' }) })
  .meta({ id: 'Species' })

const breedSchema = z
  .object({ id: uuid, name: z.string().meta({ example: 'SRD' }) })
  .meta({ id: 'Breed' })

export const catalogPaths: ZodOpenApiPathsObject = {
  '/species': {
    get: {
      tags: ['Catalog'],
      operationId: 'listSpecies',
      summary: 'Lista as espécies',
      responses: {
        '200': json('As espécies, em ordem alfabética', z.array(speciesSchema)),
        '401': unauthorized,
      },
    },
  },
  '/species/{speciesId}/breeds': {
    get: {
      tags: ['Catalog'],
      operationId: 'listBreeds',
      summary: 'Lista as raças de uma espécie',
      description: 'O SRD vem primeiro. As outras vêm em ordem alfabética.',
      requestParams: { path: z.object({ speciesId: uuid }) },
      responses: {
        '200': json('As raças', z.array(breedSchema)),
        '401': unauthorized,
        '404': error('Espécie não existe (SPECIES_NOT_FOUND)'),
      },
    },
  },
}
