-- CreateTable
CREATE TABLE "Ledger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "availableDelta" DECIMAL NOT NULL,
    "escrowDelta" DECIMAL NOT NULL,
    "ref" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Ledger_userId_idx" ON "Ledger"("userId");
