/*
  Warnings:

  - A unique constraint covering the columns `[barcode]` on the table `product` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `final_price` to the `order_item` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "order" ADD COLUMN     "doctor_name" TEXT,
ADD COLUMN     "patient_age" INTEGER,
ADD COLUMN     "patient_gender" TEXT,
ADD COLUMN     "patient_name" TEXT,
ADD COLUMN     "prescription_status" "PrescriptionStatus" DEFAULT 'NOT_REQUIRED',
ADD COLUMN     "prescription_url" TEXT;

-- AlterTable
ALTER TABLE "order_item" ADD COLUMN     "batch_number" TEXT,
ADD COLUMN     "discount_amount" DECIMAL(65,30) DEFAULT 0,
ADD COLUMN     "expiry_date" TIMESTAMP(3),
ADD COLUMN     "final_price" DECIMAL(65,30) NOT NULL;

-- AlterTable
ALTER TABLE "product" ADD COLUMN     "barcode" TEXT;

-- CreateTable
CREATE TABLE "pharmacy_product_details" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "dosage" TEXT,
    "form" TEXT,
    "pack_size" TEXT,
    "manufacturer" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requires_prescription" BOOLEAN NOT NULL,
    "discount" DECIMAL(65,30) NOT NULL,
    "discount_type" "DiscountType" NOT NULL DEFAULT 'PERCENTAGE',
    "stock" INTEGER NOT NULL,
    "in_stock" BOOLEAN NOT NULL,
    "expiry_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pharmacy_product_details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pharmacy_product_details_product_id_key" ON "pharmacy_product_details"("product_id");

-- CreateIndex
CREATE INDEX "order_prescription_status_idx" ON "order"("prescription_status");

-- CreateIndex
CREATE UNIQUE INDEX "product_barcode_key" ON "product"("barcode");

-- CreateIndex
CREATE INDEX "product_barcode_idx" ON "product"("barcode");

-- AddForeignKey
ALTER TABLE "pharmacy_product_details" ADD CONSTRAINT "pharmacy_product_details_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
