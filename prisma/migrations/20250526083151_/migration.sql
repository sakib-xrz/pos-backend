/*
  Warnings:

  - You are about to drop the column `table_number` on the `order` table. All the data in the column will be lost.
  - You are about to drop the column `restaurant_name` on the `setting` table. All the data in the column will be lost.
  - You are about to drop the `coupon` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[shop_id]` on the table `setting` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `shop_id` to the `category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shop_id` to the `order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shop_id` to the `product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shop_id` to the `receipt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `display_name` to the `setting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shop_id` to the `setting` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ShopType" AS ENUM ('RESTAURANT', 'PHARMACY');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('ONE_MONTH', 'SIX_MONTHS', 'ONE_YEAR');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';

-- DropIndex
DROP INDEX "order_created_by_status_idx";

-- DropIndex
DROP INDEX "product_category_id_is_available_idx";

-- AlterTable
ALTER TABLE "category" ADD COLUMN     "shop_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "order" DROP COLUMN "table_number",
ADD COLUMN     "shop_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "product" ADD COLUMN     "shop_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "receipt" ADD COLUMN     "shop_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "setting" DROP COLUMN "restaurant_name",
ADD COLUMN     "display_name" TEXT NOT NULL,
ADD COLUMN     "shop_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "shop_id" TEXT;

-- DropTable
DROP TABLE "coupon";

-- CreateTable
CREATE TABLE "shop" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "branch_name" TEXT,
    "type" "ShopType" NOT NULL,
    "subscription_plan" "SubscriptionPlan" NOT NULL,
    "subscription_start" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscription_end" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "setting_shop_id_key" ON "setting"("shop_id");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "category_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt" ADD CONSTRAINT "receipt_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "setting" ADD CONSTRAINT "setting_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
