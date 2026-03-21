-- AlterTable
ALTER TABLE "User" ADD COLUMN "clerkUserId" VARCHAR(255);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkUserId_key" ON "User"("clerkUserId");

-- AlterTable
ALTER TABLE "todo" ADD COLUMN "userId" INTEGER;

-- CreateIndex
CREATE INDEX "todo_userId_idx" ON "todo"("userId");

-- AddForeignKey
ALTER TABLE "todo"
ADD CONSTRAINT "todo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

