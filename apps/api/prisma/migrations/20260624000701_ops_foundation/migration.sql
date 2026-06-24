-- CreateTable
CREATE TABLE "OpsState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournamentId" TEXT NOT NULL,
    "slice" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ActivityEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournamentId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "actor" TEXT NOT NULL DEFAULT 'system',
    "summary" TEXT NOT NULL,
    "entityType" TEXT NOT NULL DEFAULT '',
    "entityId" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "StreamSessionRow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournamentId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'offline',
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "viewers" INTEGER NOT NULL DEFAULT 0,
    "bitrate" INTEGER NOT NULL DEFAULT 0,
    "latency" REAL NOT NULL DEFAULT 0,
    "dropped" INTEGER NOT NULL DEFAULT 0,
    "caster" TEXT,
    "playbackUrl" TEXT,
    "startedAt" DATETIME,
    "endedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "NotificationDelivery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournamentId" TEXT NOT NULL,
    "userId" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'in_app',
    "type" TEXT NOT NULL DEFAULT 'info',
    "title" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "sendAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" DATETIME,
    "readAt" DATETIME,
    "retries" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "OpsState_tournamentId_idx" ON "OpsState"("tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "OpsState_tournamentId_slice_key" ON "OpsState"("tournamentId", "slice");

-- CreateIndex
CREATE INDEX "ActivityEvent_tournamentId_idx" ON "ActivityEvent"("tournamentId");

-- CreateIndex
CREATE INDEX "StreamSessionRow_tournamentId_idx" ON "StreamSessionRow"("tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "StreamSessionRow_tournamentId_matchId_key" ON "StreamSessionRow"("tournamentId", "matchId");

-- CreateIndex
CREATE INDEX "NotificationDelivery_tournamentId_idx" ON "NotificationDelivery"("tournamentId");

-- CreateIndex
CREATE INDEX "NotificationDelivery_userId_idx" ON "NotificationDelivery"("userId");

-- CreateIndex
CREATE INDEX "NotificationDelivery_status_idx" ON "NotificationDelivery"("status");
