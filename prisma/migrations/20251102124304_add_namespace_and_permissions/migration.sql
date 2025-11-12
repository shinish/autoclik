-- CreateTable
CREATE TABLE "Namespace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#546aff',
    "icon" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GroupMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NamespacePermission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "namespaceId" TEXT NOT NULL,
    "userId" TEXT,
    "groupId" TEXT,
    "canRead" BOOLEAN NOT NULL DEFAULT true,
    "canWrite" BOOLEAN NOT NULL DEFAULT false,
    "canExecute" BOOLEAN NOT NULL DEFAULT false,
    "canAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NamespacePermission_namespaceId_fkey" FOREIGN KEY ("namespaceId") REFERENCES "Namespace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NamespacePermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NamespacePermission_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Namespace_name_key" ON "Namespace"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Group_name_key" ON "Group"("name");

-- CreateIndex
CREATE INDEX "GroupMember_userId_idx" ON "GroupMember"("userId");

-- CreateIndex
CREATE INDEX "GroupMember_groupId_idx" ON "GroupMember"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMember_userId_groupId_key" ON "GroupMember"("userId", "groupId");

-- CreateIndex
CREATE INDEX "NamespacePermission_namespaceId_idx" ON "NamespacePermission"("namespaceId");

-- CreateIndex
CREATE INDEX "NamespacePermission_userId_idx" ON "NamespacePermission"("userId");

-- CreateIndex
CREATE INDEX "NamespacePermission_groupId_idx" ON "NamespacePermission"("groupId");
