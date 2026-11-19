import { z } from 'zod'
import { MEDICATION_ROUTES } from './domain/medication-entity.ts'

// As datas chegam como texto "2026-11-19". O controller transforma em Date.
// A regra "término antes do início" é do domínio (Medication).
const fields = {
  name: z.string().trim().min(1, 'Name is required'),
  dosage: z.string().trim().min(1, 'Dosage is required'),
  frequency: z.string().trim().min(1, 'Frequency is required'),
  route: z.enum(MEDICATION_ROUTES),
  startDate: z.iso.date('Start date must be YYYY-MM-DD'),
  endDate: z.iso.date('End date must be YYYY-MM-DD').nullish(),
  continuousUse: z.boolean().optional(),
  notes: z.string().trim().nullish(),
}

export const registerMedicationSchema = z.object({
  ...fields,
  startDate: fields.startDate.optional(),
})

// Tudo opcional: campo ausente não muda. endDate e notes aceitam null (apagar).
export const updateMedicationSchema = z.object(fields).partial()

// ?active=true mostra só as medicações ativas
export const patientMedicationsQuerySchema = z.object({
  active: z
    .enum(['true', 'false'])
    .optional()
    .catch(undefined)
    .meta({ description: '`true` = só as ativas' }),
})
