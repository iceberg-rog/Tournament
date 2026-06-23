-- CreateTable
CREATE TABLE "OrganizerRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "org" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "experience" TEXT NOT NULL DEFAULT '',
    "links" TEXT,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "reviewerId" TEXT,
    "decisionReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "reason" TEXT,
    "before" TEXT,
    "after" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "OrganizerRequest_userId_idx" ON "OrganizerRequest"("userId");

-- CreateIndex
CREATE INDEX "OrganizerRequest_status_idx" ON "OrganizerRequest"("status");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");
