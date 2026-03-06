-- CreateEnum
CREATE TYPE "PromoDiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'BOGO', 'FREE_ITEM', 'BOGO_CATEGORY');

-- CreateEnum
CREATE TYPE "PromoTemplate" AS ENUM ('CUSTOM', 'PERCENT_OFF', 'DOLLAR_OFF', 'BOGO_ITEM', 'BOGO_CATEGORY_DEAL', 'FREE_ITEM_DEAL', 'HAPPY_HOUR', 'LOYALTY_BONUS', 'FIRST_ORDER', 'SEASONAL');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "discountId" TEXT,
ADD COLUMN     "promoCodeId" TEXT;

-- CreateTable
CREATE TABLE "promo_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "discountType" "PromoDiscountType" NOT NULL,
    "discountValue" DECIMAL(10,2) NOT NULL,
    "template" "PromoTemplate" NOT NULL DEFAULT 'CUSTOM',
    "minOrderAmount" DECIMAL(10,2),
    "maxDiscount" DECIMAL(10,2),
    "applicableItemId" TEXT,
    "applicableCategoryId" TEXT,
    "maxTotalUses" INTEGER,
    "maxUsesPerUser" INTEGER NOT NULL DEFAULT 1,
    "totalUsed" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo_code_locations" (
    "promoCodeId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,

    CONSTRAINT "promo_code_locations_pkey" PRIMARY KEY ("promoCodeId","locationId")
);

-- CreateTable
CREATE TABLE "discounts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "discountType" "PromoDiscountType" NOT NULL,
    "discountValue" DECIMAL(10,2) NOT NULL,
    "template" "PromoTemplate" NOT NULL DEFAULT 'CUSTOM',
    "minOrderAmount" DECIMAL(10,2),
    "maxDiscount" DECIMAL(10,2),
    "applicableItemId" TEXT,
    "applicableCategoryId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "activeDays" TEXT,
    "activeTimeStart" TEXT,
    "activeTimeEnd" TEXT,
    "stackable" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_locations" (
    "discountId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,

    CONSTRAINT "discount_locations_pkey" PRIMARY KEY ("discountId","locationId")
);

-- CreateIndex
CREATE UNIQUE INDEX "promo_codes_code_key" ON "promo_codes"("code");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "promo_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "discounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_codes" ADD CONSTRAINT "promo_codes_applicableItemId_fkey" FOREIGN KEY ("applicableItemId") REFERENCES "menu_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_codes" ADD CONSTRAINT "promo_codes_applicableCategoryId_fkey" FOREIGN KEY ("applicableCategoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_code_locations" ADD CONSTRAINT "promo_code_locations_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "promo_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_code_locations" ADD CONSTRAINT "promo_code_locations_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discounts" ADD CONSTRAINT "discounts_applicableItemId_fkey" FOREIGN KEY ("applicableItemId") REFERENCES "menu_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discounts" ADD CONSTRAINT "discounts_applicableCategoryId_fkey" FOREIGN KEY ("applicableCategoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_locations" ADD CONSTRAINT "discount_locations_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "discounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_locations" ADD CONSTRAINT "discount_locations_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
