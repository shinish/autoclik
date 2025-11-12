-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityName" TEXT NOT NULL,
    "description" TEXT,
    "performedBy" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Activity_entityType_idx" ON "Activity"("entityType");

-- CreateIndex
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");
