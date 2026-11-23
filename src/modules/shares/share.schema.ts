import { z } from 'zod'
import { SHARE_TYPES } from './domain/share-entity.ts'

// A regra do tipo (guardian pede guardianId) e do prazo (até 90 dias) é do domínio (Share).
export const createShareSchema = z.object({
  type: z.enum(SHARE_TYPES),
  guardianId: z.uuid().nullish(),
  patientIds: z.array(z.uuid()).min(1, 'At least one patient').max(20),
  recipientName: z.string().trim().nullish(),
  // Sem prazo, vale 7 dias
  expiresAt: z.iso.datetime({ offset: true }).optional(),
})
