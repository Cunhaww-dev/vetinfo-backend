-- CreateIndex
CREATE UNIQUE INDEX "patients_user_id_microchip_key" ON "patients"("user_id", "microchip");
