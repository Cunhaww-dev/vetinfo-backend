// A escala do escore corporal depende da espécie:
// - '1-9': cão e gato (WSAVA), equino (Henneke). Só números inteiros.
// - '1-5': produção (bovino, ovino, caprino, suíno), aves e exóticos. Passo de 0,5.
export const BODY_CONDITION_SCALES = ['1-9', '1-5'] as const

export type BodyConditionScale = (typeof BODY_CONDITION_SCALES)[number]

const RULES: Record<BodyConditionScale, { max: number; step: number }> = {
  '1-9': { max: 9, step: 1 },
  '1-5': { max: 5, step: 0.5 },
}

// 4,5 vale na escala de 1 a 5, mas não na de 1 a 9
export function isValidScore(score: number, scale: BodyConditionScale) {
  const { max, step } = RULES[scale]
  return score >= 1 && score <= max && Number.isInteger(score / step)
}
