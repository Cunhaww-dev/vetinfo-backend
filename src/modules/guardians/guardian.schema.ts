import { z } from 'zod'

// Só a forma. O formato da UF e do CEP é regra do domínio (Address).
export const addressSchema = z.object({
  street: z.string().trim().min(1, 'Street is required'),
  number: z.string().trim().min(1, 'Number is required'),
  complement: z.string().trim().nullish(),
  district: z.string().trim().min(1, 'District is required'),
  city: z.string().trim().min(1, 'City is required'),
  state: z.string().trim().min(1, 'State is required'),
  zipCode: z.string().trim().min(1, 'Zip code is required'),
})

export const createGuardianSchema = z.object({
  name: z.string().trim().min(3, 'Name must have at least 3 characters'),
  phone: z.string().trim().nullish(),
  email: z.email('Invalid email format').nullish(),
  address: addressSchema.nullish(),
})

export const updateGuardianSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Name must have at least 3 characters')
    .optional(),
  phone: z.string().trim().nullish(),
  email: z.email('Invalid email format').nullish(),
})
