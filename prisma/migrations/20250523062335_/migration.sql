-- AlterTable
ALTER TABLE "category" ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "coupon" ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "product" ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "category_is_deleted_idx" ON "category"("is_deleted");

-- CreateIndex
CREATE INDEX "coupon_is_deleted_idx" ON "coupon"("is_deleted");

-- CreateIndex
CREATE INDEX "product_is_deleted_idx" ON "product"("is_deleted");

-- CreateIndex
CREATE INDEX "user_is_deleted_idx" ON "user"("is_deleted");
