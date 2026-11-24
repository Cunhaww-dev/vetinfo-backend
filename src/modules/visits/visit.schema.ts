import { z } from 'zod'

// O Zod confere o formato (número, inteiro). As faixas aceitas são regra do domínio (VitalSigns).
const vitalSignsSchema = z.object({
  weightKg: z.number().nullish(),
  temperatureC: z.number().nullish(),
  heartRate: z.number().int().nullish(),
  respiratoryRate: z.number().int().nullish(),
  bodyConditionScore: z.number().nullish(),
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
  type: z.enum(['consultation', 'vaccination']).optional().meta({
    description:
      'Consulta (padrão) ou vacinação. A vacinação não tem SOAP. Nunca muda depois de criado',
  }),
  visitedAt: z.iso.datetime({ offset: true }).optional(),
  vitalSigns: vitalSignsSchema.optional(),
  soap: soapSchema.optional(),
}

export const registerVisitSchema = z.object(fields)

// Sem o tipo: ele nunca muda. Se vier no corpo, o Zod tira.
export const updateVisitSchema = z.object({
  visitedAt: fields.visitedAt,
  vitalSigns: vitalSignsSchema.partial().optional(),
  soap: soapSchema.partial().optional(),
})

// ?limit= vem como texto. Fora de 1 a 10 (ou não numérico) vale o padrão 3, sem erro.
export const recentPatientsQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(10)
    .default(3)
    .catch(3)
    .meta({ description: 'Quantos pacientes, de 1 a 10. O padrão é 3' }),
})

// Filtros da tela de atendimentos. Valor inválido vira "sem filtro", sem erro,
// igual ao ?limit= acima. As datas têm fuso: o front manda o começo e o fim do dia dele.
export const searchVisitsQuerySchema = z.object({
  speciesId: z
    .uuid()
    .optional()
    .catch(undefined)
    .meta({ description: 'Só os atendimentos de pacientes desta espécie' }),
  type: z
    .enum(['consultation', 'vaccination'])
    .optional()
    .catch(undefined)
    .meta({ description: 'Só as consultas ou só as vacinações' }),
  status: z.enum(['open', 'finished']).optional().catch(undefined).meta({
    description: 'open = em andamento, finished = finalizados',
  }),
  from: z.iso.datetime({ offset: true }).optional().catch(undefined).meta({
    description: 'Atendidos a partir desta data e hora',
    example: '2026-11-01T00:00:00-03:00',
  }),
  to: z.iso.datetime({ offset: true }).optional().catch(undefined).meta({
    description: 'Atendidos até esta data e hora',
    example: '2026-11-30T23:59:59-03:00',
  }),
  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1)
    .catch(1)
    .meta({ description: 'A página, a partir de 1. Cada página tem 20 itens' }),
})
