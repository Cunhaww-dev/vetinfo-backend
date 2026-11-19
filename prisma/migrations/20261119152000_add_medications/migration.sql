-- CreateEnum
CREATE TYPE "MedicationRoute" AS ENUM ('oral', 'topical', 'subcutaneous', 'intramuscular', 'intravenous', 'ophthalmic', 'otic', 'rectal', 'inhalation', 'other');

-- CreateTable
CREATE TABLE "medications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "visit_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "route" "MedicationRoute" NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "continuous_use" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "medications_user_id_idx" ON "medications"("user_id");

-- CreateIndex
CREATE INDEX "medications_visit_id_idx" ON "medications"("visit_id");

-- AddForeignKey
ALTER TABLE "medications" ADD CONSTRAINT "medications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medications" ADD CONSTRAINT "medications_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

