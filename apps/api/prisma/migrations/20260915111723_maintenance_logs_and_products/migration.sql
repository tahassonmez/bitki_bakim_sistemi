-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('FERTILIZER', 'PESTICIDE', 'OTHER');

-- CreateTable
CREATE TABLE "MaintenanceType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MaintenanceType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ProductType" NOT NULL,
    "unit" TEXT,
    "stockQuantity" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceLog" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceLogAction" (
    "id" TEXT NOT NULL,
    "logId" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,

    CONSTRAINT "MaintenanceLogAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceLogProduct" (
    "id" TEXT NOT NULL,
    "logId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantityUsed" DOUBLE PRECISION,

    CONSTRAINT "MaintenanceLogProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "logId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceType_name_key" ON "MaintenanceType"("name");

-- CreateIndex
CREATE INDEX "MaintenanceLog_plantId_idx" ON "MaintenanceLog"("plantId");

-- CreateIndex
CREATE INDEX "MaintenanceLog_date_idx" ON "MaintenanceLog"("date");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceLogAction_logId_typeId_key" ON "MaintenanceLogAction"("logId", "typeId");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceLogProduct_logId_productId_key" ON "MaintenanceLogProduct"("logId", "productId");

-- AddForeignKey
ALTER TABLE "MaintenanceLog" ADD CONSTRAINT "MaintenanceLog_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceLog" ADD CONSTRAINT "MaintenanceLog_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceLogAction" ADD CONSTRAINT "MaintenanceLogAction_logId_fkey" FOREIGN KEY ("logId") REFERENCES "MaintenanceLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceLogAction" ADD CONSTRAINT "MaintenanceLogAction_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "MaintenanceType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceLogProduct" ADD CONSTRAINT "MaintenanceLogProduct_logId_fkey" FOREIGN KEY ("logId") REFERENCES "MaintenanceLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceLogProduct" ADD CONSTRAINT "MaintenanceLogProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_logId_fkey" FOREIGN KEY ("logId") REFERENCES "MaintenanceLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
