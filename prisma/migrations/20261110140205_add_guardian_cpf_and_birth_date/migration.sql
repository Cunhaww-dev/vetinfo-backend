-- AlterTable
ALTER TABLE "guardians" ADD COLUMN     "birth_date" DATE NOT NULL,
ADD COLUMN     "cpf" TEXT,
ALTER COLUMN "phone" SET NOT NULL,
ALTER COLUMN "email" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "guardians_user_id_cpf_key" ON "guardians"("user_id", "cpf");
