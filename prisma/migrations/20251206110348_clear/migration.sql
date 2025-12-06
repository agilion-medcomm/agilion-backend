-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'CLEANER';

-- CreateTable
CREATE TABLE "cleaners" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "cleaners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cleaning_records" (
    "id" SERIAL NOT NULL,
    "cleanerId" INTEGER NOT NULL,
    "area" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "photoUrl" TEXT,
    "date" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cleaning_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cleaners_userId_key" ON "cleaners"("userId");

-- AddForeignKey
ALTER TABLE "cleaners" ADD CONSTRAINT "cleaners_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cleaning_records" ADD CONSTRAINT "cleaning_records_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "cleaners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
