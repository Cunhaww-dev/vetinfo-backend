import { z } from 'zod'
import type { ZodOpenApiResponseObject } from 'zod-openapi'

// Peças que todo módulo usa na própria doc. O formato é o mesmo do errorHandler.
export const errorSchema = z
  .object({
    code: z.string().meta({ example: 'PATIENT_NOT_FOUND' }),
    message: z.string().meta({ example: 'Patient 123 not found' }),
  })
  .meta({ id: 'Error' })

const validationErrorSchema = z
  .object({
    code: z.string().meta({ example: 'VALIDATION_ERROR' }),
    message: z.string().meta({ example: 'Invalid request body' }),
    issues: z.array(z.object({ field: z.string(), message: z.string() })),
  })
  .meta({ id: 'ValidationError' })

export const uuid = z
  .uuid()
  .meta({ example: '8641c516-3785-4f9f-bb2d-5a74479ce583' })

export function json(
  description: string,
  schema: z.ZodType,
): ZodOpenApiResponseObject {
  return { description, content: { 'application/json': { schema } } }
}

export function error(description: string): ZodOpenApiResponseObject {
  return json(description, errorSchema)
}

export const badRequest = json(
  'Corpo fora do formato (VALIDATION_ERROR) ou JSON quebrado (INVALID_JSON)',
  validationErrorSchema,
)

export const unauthorized = error('Sem sessão (UNAUTHORIZED)')
