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

// Só a forma. Os dígitos do CPF e a data no futuro são regra do domínio (Guardian).
const fields = {
  name: z.string().trim().min(3, 'Name must have at least 3 characters'),
  phone: z.string().trim().min(1, 'Phone is required'),
  email: z.email('Invalid email format'),
  cpf: z.string().trim().nullish(),
  birthDate: z.iso.date('Birth date must be YYYY-MM-DD'),
}

export const createGuardianSchema = z.object({
  ...fields,
  address: addressSchema.nullish(),
})

// Tudo opcional: campo ausente não muda. Só o CPF aceita null (apagar).
export const updateGuardianSchema = z.object(fields).partial()
