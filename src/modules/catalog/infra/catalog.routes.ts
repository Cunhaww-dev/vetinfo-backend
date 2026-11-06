import { Router } from 'express'
import { prisma } from '../../../shared/prisma/client.ts'
import { ListBreeds } from '../application/list-breeds.usecase.ts'
import { ListSpecies } from '../application/list-species.usecase.ts'
import { CatalogController } from './catalog.controller.ts'
import { PrismaCatalogRepository } from './prisma-catalog.repository.ts'
import { ensureAuthenticated } from '../../../shared/http/ensure-authenticated.middleware.ts'

const catalogRepository = new PrismaCatalogRepository(prisma)

const controller = new CatalogController(
  new ListSpecies(catalogRepository),
  new ListBreeds(catalogRepository),
)

export const catalogRouter = Router()

catalogRouter.get('/species', ensureAuthenticated, controller.listSpecies)
catalogRouter.get(
  '/species/:speciesId/breeds',
  ensureAuthenticated,
  controller.listBreeds,
)
