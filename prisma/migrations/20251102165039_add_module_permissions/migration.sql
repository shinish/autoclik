-- CreateTable
CREATE TABLE "ModulePermission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "canRead" BOOLEAN NOT NULL DEFAULT true,
    "canWrite" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ModulePermission_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPredefined" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Group" ("createdAt", "description", "id", "name", "updatedAt") SELECT "createdAt", "description", "id", "name", "updatedAt" FROM "Group";
DROP TABLE "Group";
ALTER TABLE "new_Group" RENAME TO "Group";
CREATE UNIQUE INDEX "Group_name_key" ON "Group"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ModulePermission_groupId_idx" ON "ModulePermission"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "ModulePermission_groupId_module_key" ON "ModulePermission"("groupId", "module");
