-- CreateTable
CREATE TABLE "ControlBoard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournamentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "game" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "prize" INTEGER NOT NULL DEFAULT 0,
    "phase" TEXT NOT NULL,
    "currentRound" INTEGER NOT NULL DEFAULT 0,
    "totalRounds" INTEGER NOT NULL DEFAULT 0,
    "roundName" TEXT NOT NULL DEFAULT '',
    "nextScheduled" TEXT,
    "estimatedFinish" TEXT,
    "participants" JSONB NOT NULL,
    "matches" JSONB NOT NULL,
    "disputes" JSONB NOT NULL,
    "activity" JSONB NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "ControlBoard_tournamentId_key" ON "ControlBoard"("tournamentId");
