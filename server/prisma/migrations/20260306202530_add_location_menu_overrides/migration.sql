-- CreateTable
CREATE TABLE "location_menu_overrides" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "location_menu_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "location_menu_overrides_locationId_menuItemId_key" ON "location_menu_overrides"("locationId", "menuItemId");

-- AddForeignKey
ALTER TABLE "location_menu_overrides" ADD CONSTRAINT "location_menu_overrides_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_menu_overrides" ADD CONSTRAINT "location_menu_overrides_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
