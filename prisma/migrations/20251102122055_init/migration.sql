-- CreateTable
CREATE TABLE "Automation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "namespace" TEXT NOT NULL,
    "description" TEXT,
    "keywords" TEXT,
    "tags" TEXT,
    "formSchema" TEXT NOT NULL,
    "apiEndpoint" TEXT,
    "templateId" TEXT,
    "inventoryId" TEXT,
    "extraVars" TEXT,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "runs" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Run" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "automationId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "parameters" TEXT,
    "result" TEXT,
    "errorMessage" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "awxJobId" TEXT,
    CONSTRAINT "Run_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "Automation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "cron" TEXT NOT NULL,
    "parameters" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "nextRun" DATETIME,
    "lastRun" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Schedule_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "Automation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ConnectivityCheck" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "servers" TEXT NOT NULL,
    "ports" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "results" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME
);

-- CreateIndex
CREATE INDEX "Run_automationId_idx" ON "Run"("automationId");

-- CreateIndex
CREATE INDEX "Schedule_automationId_idx" ON "Schedule"("automationId");
