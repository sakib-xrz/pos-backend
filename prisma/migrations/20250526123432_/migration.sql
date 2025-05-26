-- AlterTable
ALTER TABLE "setting" ALTER COLUMN "address" DROP NOT NULL,
ALTER COLUMN "phone_number" DROP NOT NULL,
ALTER COLUMN "logo_url" DROP NOT NULL,
ALTER COLUMN "receipt_header_text" DROP NOT NULL,
ALTER COLUMN "receipt_footer_text" DROP NOT NULL;
