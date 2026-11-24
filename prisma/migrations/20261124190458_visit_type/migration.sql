-- CreateEnum
CREATE TYPE "VisitType" AS ENUM ('consultation', 'vaccination');

-- AlterTable
ALTER TABLE "visits" ADD COLUMN     "type" "VisitType" NOT NULL DEFAULT 'consultation';
