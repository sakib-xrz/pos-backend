-- AlterTable
ALTER TABLE "category" ADD COLUMN     "image" TEXT;

-- AlterTable
ALTER TABLE "product" ALTER COLUMN "image" DROP NOT NULL;
