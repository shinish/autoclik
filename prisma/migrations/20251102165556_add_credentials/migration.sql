-- CreateTable
CREATE TABLE "Credential" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "credentialType" TEXT NOT NULL,
    "username" TEXT,
    "password" TEXT,
    "sshPrivateKey" TEXT,
    "vaultPassword" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Credential_name_key" ON "Credential"("name");
