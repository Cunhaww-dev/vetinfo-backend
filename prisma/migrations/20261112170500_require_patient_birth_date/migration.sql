-- Antes desta migration, o banco só tinha pacientes de teste.
-- Paciente sem nascimento recebe a data mais antiga entre o cadastro e o primeiro atendimento.
-- Assim nenhum atendimento fica antes do nascimento.
UPDATE "patients" AS p
SET "birth_date" = LEAST(
  p."created_at"::date,
  (SELECT MIN(v."visited_at")::date FROM "visits" AS v WHERE v."patient_id" = p."id")
)
WHERE p."birth_date" IS NULL;

-- AlterTable
ALTER TABLE "patients" ALTER COLUMN "birth_date" SET NOT NULL;
