-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'FARMER',
    "organization" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchNumber" TEXT NOT NULL,
    "skuName" TEXT,
    "currentStage" TEXT NOT NULL DEFAULT 'PLANTING',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "plantingId" TEXT,
    "processingId" TEXT,
    "storageId" TEXT,
    "roastingId" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Batch_plantingId_fkey" FOREIGN KEY ("plantingId") REFERENCES "PlantingRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Batch_processingId_fkey" FOREIGN KEY ("processingId") REFERENCES "ProcessingRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Batch_storageId_fkey" FOREIGN KEY ("storageId") REFERENCES "StorageRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Batch_roastingId_fkey" FOREIGN KEY ("roastingId") REFERENCES "RoastingRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Batch_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlantingRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farmLocation" TEXT NOT NULL,
    "altitude" REAL,
    "sunlightHours" REAL,
    "tempDifference" REAL,
    "rainfall" REAL,
    "soilData" TEXT,
    "harvestTime" DATETIME NOT NULL,
    "harvestQuantity" REAL,
    "qualityGrade" TEXT
);

-- CreateTable
CREATE TABLE "ProcessingRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "method" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "durationHours" REAL,
    "phValue" TEXT,
    "temperature" REAL,
    "notes" TEXT
);

-- CreateTable
CREATE TABLE "StorageRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conditions" TEXT,
    "temperature" REAL,
    "humidity" REAL,
    "storageDuration" INTEGER,
    "moisture" REAL,
    "waterActivity" REAL,
    "density" REAL
);

-- CreateTable
CREATE TABLE "RoastingRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "machineName" TEXT,
    "roastDate" DATETIME,
    "roastCurveImg" TEXT,
    "roastCurveData" TEXT,
    "agtronBean" REAL,
    "agtronGround" REAL,
    "cuppingScore" REAL,
    "cuppingNotes" TEXT,
    "cuppingFlavors" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_batchNumber_key" ON "Batch"("batchNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_plantingId_key" ON "Batch"("plantingId");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_processingId_key" ON "Batch"("processingId");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_storageId_key" ON "Batch"("storageId");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_roastingId_key" ON "Batch"("roastingId");

-- CreateIndex
CREATE INDEX "Batch_batchNumber_idx" ON "Batch"("batchNumber");

-- CreateIndex
CREATE INDEX "Batch_createdById_idx" ON "Batch"("createdById");

-- CreateIndex
CREATE INDEX "Batch_currentStage_idx" ON "Batch"("currentStage");
