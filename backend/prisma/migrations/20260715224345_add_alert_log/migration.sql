-- CreateTable
CREATE TABLE "AlertLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AlertLog_userId_category_sentAt_idx" ON "AlertLog"("userId", "category", "sentAt");

-- AddForeignKey
ALTER TABLE "AlertLog" ADD CONSTRAINT "AlertLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
