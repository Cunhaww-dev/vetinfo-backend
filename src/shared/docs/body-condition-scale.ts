import { z } from 'zod'
import { BODY_CONDITION_SCALES } from '../../modules/catalog/domain/body-condition-scale.ts'

// Usado na espécie, no paciente, no atendimento e no compartilhamento
export const bodyConditionScaleSchema = z.enum(BODY_CONDITION_SCALES).meta({
  description:
    'Escala do escore corporal. 1-9: inteiros (cão, gato, equino). 1-5: passo de 0,5 (produção, aves, exóticos)',
})
