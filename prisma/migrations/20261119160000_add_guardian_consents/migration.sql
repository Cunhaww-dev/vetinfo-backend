-- CreateTable
CREATE TABLE "guardian_consents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "guardian_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "term_version" TEXT NOT NULL,
    "accepted_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guardian_consents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "guardian_consents_user_id_idx" ON "guardian_consents"("user_id");

-- CreateIndex
CREATE INDEX "guardian_consents_patient_id_idx" ON "guardian_consents"("patient_id");

-- AddForeignKey
ALTER TABLE "guardian_consents" ADD CONSTRAINT "guardian_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardian_consents" ADD CONSTRAINT "guardian_consents_guardian_id_fkey" FOREIGN KEY ("guardian_id") REFERENCES "guardians"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardian_consents" ADD CONSTRAINT "guardian_consents_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Só um consentimento ativo (sem revokedAt) por tutor e paciente.
-- O Prisma não escreve índice parcial, então ele entra aqui, na mão.
CREATE UNIQUE INDEX "guardian_consents_one_active_key" ON "guardian_consents"("guardian_id", "patient_id") WHERE "revoked_at" IS NULL;
