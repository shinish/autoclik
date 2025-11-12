-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Automation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "namespace" TEXT NOT NULL,
    "description" TEXT,
    "keywords" TEXT,
    "tags" TEXT,
    "formSchema" TEXT NOT NULL,
    "apiEndpoint" TEXT,
    "templateId" TEXT NOT NULL,
    "inventoryId" TEXT,
    "extraVars" TEXT,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "runs" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Automation" ("apiEndpoint", "createdAt", "createdBy", "description", "extraVars", "formSchema", "id", "inventoryId", "keywords", "name", "namespace", "pinned", "runs", "tags", "templateId", "updatedAt") SELECT "apiEndpoint", "createdAt", "createdBy", "description", "extraVars", "formSchema", "id", "inventoryId", "keywords", "name", "namespace", "pinned", "runs", "tags", "templateId", "updatedAt" FROM "Automation";
DROP TABLE "Automation";
ALTER TABLE "new_Automation" RENAME TO "Automation";
CREATE UNIQUE INDEX "Automation_name_key" ON "Automation"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
