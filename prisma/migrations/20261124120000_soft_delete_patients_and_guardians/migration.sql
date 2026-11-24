-- Soft delete do paciente e do tutor
ALTER TABLE "patients" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "guardians" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- O microchip e o CPF só não repetem entre os registros vivos.
-- Assim, o vet cadastra de novo um animal ou um tutor que ele apagou.
-- O Prisma não escreve índice parcial, então ele entra aqui, na mão.
DROP INDEX "patients_user_id_microchip_key";
CREATE UNIQUE INDEX "patients_user_id_microchip_key" ON "patients"("user_id", "microchip") WHERE "deleted_at" IS NULL;

DROP INDEX "guardians_user_id_cpf_key";
CREATE UNIQUE INDEX "guardians_user_id_cpf_key" ON "guardians"("user_id", "cpf") WHERE "deleted_at" IS NULL;
