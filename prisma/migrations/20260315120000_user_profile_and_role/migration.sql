-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CAT1', 'CAT2', 'CAT3');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'CAT1';

