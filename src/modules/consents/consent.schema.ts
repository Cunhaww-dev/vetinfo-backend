import { z } from 'zod'

// A data chega como texto ISO. O controller transforma em Date.
// A regra "não pode ser no futuro" é do domínio (GuardianConsent).
export const registerConsentSchema = z.object({
  termVersion: z.string().trim().min(1, 'Term version is required'),
  acceptedAt: z.iso.datetime({ offset: true }).optional(),
  notes: z.string().trim().nullish(),
})
