-- CreateTable
CREATE TABLE "vaccines" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "visit_id" TEXT,
    "name" TEXT NOT NULL,
    "applied_at" DATE NOT NULL,
    "next_dose_at" DATE,
    "manufacturer" TEXT,
    "batch" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vaccines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vaccines_user_id_next_dose_at_idx" ON "vaccines"("user_id", "next_dose_at");

-- CreateIndex
CREATE INDEX "vaccines_patient_id_idx" ON "vaccines"("patient_id");

-- CreateIndex
CREATE INDEX "vaccines_visit_id_idx" ON "vaccines"("visit_id");

-- AddForeignKey
ALTER TABLE "vaccines" ADD CONSTRAINT "vaccines_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccines" ADD CONSTRAINT "vaccines_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccines" ADD CONSTRAINT "vaccines_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

