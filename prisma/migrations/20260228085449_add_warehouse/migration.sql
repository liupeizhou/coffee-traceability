-- AlterTable
ALTER TABLE "StorageRecord" ADD COLUMN "warehouseAddress" TEXT;
ALTER TABLE "StorageRecord" ADD COLUMN "warehouseName" TEXT;

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "description" TEXT,
    "capacity" REAL,
    "temperature" REAL,
    "humidity" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Warehouse_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
