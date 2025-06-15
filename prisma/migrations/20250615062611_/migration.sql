/*
  Warnings:

  - You are about to drop the column `doctor_name` on the `order` table. All the data in the column will be lost.
  - You are about to drop the column `patient_age` on the `order` table. All the data in the column will be lost.
  - You are about to drop the column `patient_gender` on the `order` table. All the data in the column will be lost.
  - You are about to drop the column `patient_name` on the `order` table. All the data in the column will be lost.
  - You are about to drop the column `prescription_status` on the `order` table. All the data in the column will be lost.
  - You are about to drop the column `prescription_url` on the `order` table. All the data in the column will be lost.
  - You are about to drop the column `batch_number` on the `order_item` table. All the data in the column will be lost.
  - You are about to drop the column `expiry_date` on the `order_item` table. All the data in the column will be lost.
  - You are about to drop the column `requires_prescription` on the `pharmacy_product_details` table. All the data in the column will be lost.
  - You are about to drop the `receipt` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `sub_total_amount` to the `order` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "receipt" DROP CONSTRAINT "receipt_order_id_fkey";

-- DropForeignKey
ALTER TABLE "receipt" DROP CONSTRAINT "receipt_printed_by_fkey";

-- DropForeignKey
ALTER TABLE "receipt" DROP CONSTRAINT "receipt_shop_id_fkey";

-- DropIndex
DROP INDEX "order_prescription_status_idx";

-- AlterTable
ALTER TABLE "order" DROP COLUMN "doctor_name",
DROP COLUMN "patient_age",
DROP COLUMN "patient_gender",
DROP COLUMN "patient_name",
DROP COLUMN "prescription_status",
DROP COLUMN "prescription_url",
ADD COLUMN     "sub_total_amount" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "tax_amount" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "order_item" DROP COLUMN "batch_number",
DROP COLUMN "expiry_date";

-- AlterTable
ALTER TABLE "pharmacy_product_details" DROP COLUMN "requires_prescription",
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "discount" DROP NOT NULL,
ALTER COLUMN "stock" DROP NOT NULL,
ALTER COLUMN "in_stock" DROP NOT NULL,
ALTER COLUMN "expiry_date" DROP NOT NULL;

-- DropTable
DROP TABLE "receipt";

-- DropEnum
DROP TYPE "PrescriptionStatus";

-- CreateTable
CREATE TABLE "restaurant_product_details" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "description" TEXT,
    "preparation_time" INTEGER,
    "is_vegetarian" BOOLEAN NOT NULL DEFAULT false,
    "is_vegan" BOOLEAN NOT NULL DEFAULT false,
    "is_spicy" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurant_product_details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_product_details_product_id_key" ON "restaurant_product_details"("product_id");

-- AddForeignKey
ALTER TABLE "restaurant_product_details" ADD CONSTRAINT "restaurant_product_details_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
