-- AlterTable
ALTER TABLE "Automation" ADD COLUMN "instanceGroupId" TEXT;

-- CreateTable
CREATE TABLE "InstanceGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "awxId" TEXT,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "InstanceGroup_name_key" ON "InstanceGroup"("name");
