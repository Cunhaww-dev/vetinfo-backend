import { z } from 'zod'

// O Zod confere o formato (número, inteiro). As faixas aceitas são regra do domínio (VitalSigns).
const vitalSignsSchema = z.object({
  weightKg: z.number().nullish(),
  temperatureC: z.number().nullish(),
  heartRate: z.number().int().nullish(),
  respiratoryRate: z.number().int().nullish(),
})

const soapSchema = z.object({
  subjective: z.string().nullish(),
  objective: z.string().nullish(),
  assessment: z.string().nullish(),
  plan: z.string().nullish(),
})

// A data chega como texto "2026-11-06T14:30:00-03:00". O controller transforma em Date.
// Sem a data, o atendimento fica com a hora atual.
const fields = {
  visitedAt: z.iso.datetime({ offset: true }).optional(),
  vitalSigns: vitalSignsSchema.optional(),
  soap: soapSchema.optional(),
}

export const registerVisitSchema = z.object(fields)

export const updateVisitSchema = z.object({
  visitedAt: fields.visitedAt,
  vitalSigns: vitalSignsSchema.partial().optional(),
  soap: soapSchema.partial().optional(),
})
