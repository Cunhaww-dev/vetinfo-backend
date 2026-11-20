import type { BodyConditionScale as ScaleRow } from '../../generated/prisma/client.ts'
import type { BodyConditionScale } from '../../modules/catalog/domain/body-condition-scale.ts'

// O enum do Postgres não aceita "1-9" como nome. O banco guarda nine_point e five_point.
const FROM_ROW: Record<ScaleRow, BodyConditionScale> = {
  nine_point: '1-9',
  five_point: '1-5',
}

const TO_ROW: Record<BodyConditionScale, ScaleRow> = {
  '1-9': 'nine_point',
  '1-5': 'five_point',
}

export const scaleFromRow = (row: ScaleRow) => FROM_ROW[row]
export const scaleToRow = (scale: BodyConditionScale) => TO_ROW[scale]
