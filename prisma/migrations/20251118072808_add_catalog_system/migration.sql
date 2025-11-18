-- CreateTable
CREATE TABLE "Catalog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT,
    "namespaceId" TEXT NOT NULL,
    "environmentId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "customBody" TEXT,
    "formSchema" TEXT,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Catalog_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "AwxEnvironment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CatalogExecution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "catalogId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "parameters" TEXT,
    "consoleOutput" TEXT,
    "artifacts" TEXT,
    "errorMessage" TEXT,
    "awxJobId" TEXT,
    "executedBy" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "CatalogExecution_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "Catalog" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Catalog_name_key" ON "Catalog"("name");

-- CreateIndex
CREATE INDEX "Catalog_namespaceId_idx" ON "Catalog"("namespaceId");

-- CreateIndex
CREATE INDEX "Catalog_environmentId_idx" ON "Catalog"("environmentId");

-- CreateIndex
CREATE INDEX "CatalogExecution_catalogId_idx" ON "CatalogExecution"("catalogId");

-- CreateIndex
CREATE INDEX "CatalogExecution_executedBy_idx" ON "CatalogExecution"("executedBy");

-- CreateIndex
CREATE INDEX "CatalogExecution_status_idx" ON "CatalogExecution"("status");
