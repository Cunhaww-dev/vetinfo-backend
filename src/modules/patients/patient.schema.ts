import { z } from 'zod'

// A data chega como texto "2020-05-31". O controller transforma em Date.
// A regra "não pode ser no futuro" é do domínio (Patient), e não daqui.
const fields = {
  guardianId: z.string().trim().min(1).nullish(),
  breedId: z.string().trim().min(1, 'Breed is required'),
  name: z.string().trim().min(1, 'Name is required'),
  sex: z.enum(['male', 'female']),
  neutered: z.boolean().optional(),
  coatColor: z.string().trim().nullish(),
  birthDate: z.iso.date('Birth date must be YYYY-MM-DD').nullish(),
  microchip: z.string().trim().nullish(),
}

export const registerPatientSchema = z.object(fields)

export const updatePatientSchema = z.object(fields).partial()
