import { z } from 'zod'

// As datas chegam como texto "2026-11-19". O controller transforma em Date.
// As regras de data (futuro, antes do nascimento, próxima dose) são do domínio (Vaccine).
const fields = {
  name: z.string().trim().min(1, 'Name is required'),
  appliedAt: z.iso.date('Applied date must be YYYY-MM-DD'),
  nextDoseAt: z.iso.date('Next dose must be YYYY-MM-DD').nullish(),
  manufacturer: z.string().trim().nullish(),
  batch: z.string().trim().nullish(),
  notes: z.string().trim().nullish(),
}

export const registerVaccineSchema = z.object({
  ...fields,
  appliedAt: fields.appliedAt.optional(),
  visitId: z.uuid().nullish(),
})

// Tudo opcional: campo ausente não muda. Os campos opcionais aceitam null (apagar).
export const updateVaccineSchema = z.object(fields).partial()

// ?days= vem como texto. Fora de 1 a 365 (ou não numérico) vale o padrão 30, sem erro.
export const dueVaccinesQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30).catch(30).meta({
    description: 'Quantos dias para a frente, de 1 a 365. O padrão é 30',
  }),
})
