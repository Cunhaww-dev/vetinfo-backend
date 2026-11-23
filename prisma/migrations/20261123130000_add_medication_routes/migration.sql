-- 4 vias de medicação a mais (decisão de 23/11/2026). "other" continua no fim.
ALTER TYPE "MedicationRoute" ADD VALUE 'intranasal' BEFORE 'other';
ALTER TYPE "MedicationRoute" ADD VALUE 'transdermal' BEFORE 'other';
ALTER TYPE "MedicationRoute" ADD VALUE 'intraocular' BEFORE 'other';
ALTER TYPE "MedicationRoute" ADD VALUE 'intraarticular' BEFORE 'other';
