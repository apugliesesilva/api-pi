-- AlterTable
ALTER TABLE "periods" ALTER COLUMN "order" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "subjects" ADD COLUMN     "periodId" TEXT;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;
