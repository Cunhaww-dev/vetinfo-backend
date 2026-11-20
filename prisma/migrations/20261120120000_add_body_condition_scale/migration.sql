-- CreateEnum
CREATE TYPE "BodyConditionScale" AS ENUM ('nine_point', 'five_point');

-- AlterTable
ALTER TABLE "species" ADD COLUMN     "body_condition_scale" "BodyConditionScale" NOT NULL DEFAULT 'nine_point';

-- AlterTable
ALTER TABLE "visits" ADD COLUMN     "body_condition_scale" "BodyConditionScale",
ALTER COLUMN "body_condition_score" SET DATA TYPE DOUBLE PRECISION;

-- Os escores que já existem foram registrados na escala de 1 a 9
UPDATE "visits" SET "body_condition_scale" = 'nine_point' WHERE "body_condition_score" IS NOT NULL;

-- Aves usam a escala de 1 a 5 (quilha)
UPDATE "species" SET "body_condition_scale" = 'five_point' WHERE "name" = 'Ave';
