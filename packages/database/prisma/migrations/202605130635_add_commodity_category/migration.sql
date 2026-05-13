-- AlterTable
ALTER TABLE "commodities" ADD COLUMN     "category_id" UUID;

-- CreateTable
CREATE TABLE "commodity_categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(200),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commodity_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "commodity_categories_name_key" ON "commodity_categories"("name");

-- AddForeignKey
ALTER TABLE "commodities" ADD CONSTRAINT "commodities_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "commodity_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

