-- AlterTable
ALTER TABLE "visits" ADD COLUMN     "finished_at" TIMESTAMP(3);

-- Os atendimentos de antes das etapas já estavam completos: viram finalizados
UPDATE "visits" SET "finished_at" = "created_at";
