-- AlterTable
ALTER TABLE "attachments" ADD COLUMN     "deleted_at" TIMESTAMP(3);
-- AlterTable
ALTER TABLE "medications" ADD COLUMN     "deleted_at" TIMESTAMP(3);
-- AlterTable
ALTER TABLE "vaccines" ADD COLUMN     "deleted_at" TIMESTAMP(3);
-- AlterTable
ALTER TABLE "visits" ADD COLUMN     "deleted_at" TIMESTAMP(3);
