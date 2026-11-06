-- CreateTable
CREATE TABLE "visits" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "author_type" "UserType" NOT NULL,
    "patient_id" TEXT NOT NULL,
    "visited_at" TIMESTAMP(3) NOT NULL,
    "weight_kg" DOUBLE PRECISION,
    "temperature_c" DOUBLE PRECISION,
    "heart_rate" INTEGER,
    "respiratory_rate" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visit_soaps" (
    "visit_id" TEXT NOT NULL,
    "subjective" TEXT,
    "objective" TEXT,
    "assessment" TEXT,
    "plan" TEXT,

    CONSTRAINT "visit_soaps_pkey" PRIMARY KEY ("visit_id")
);

-- CreateIndex
CREATE INDEX "visits_user_id_idx" ON "visits"("user_id");

-- CreateIndex
CREATE INDEX "visits_patient_id_visited_at_idx" ON "visits"("patient_id", "visited_at");

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_soaps" ADD CONSTRAINT "visit_soaps_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
