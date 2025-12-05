-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'LABORANT';

-- CreateTable
CREATE TABLE "laborants" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "laborants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_files" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "laborantId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSizeKB" DOUBLE PRECISION NOT NULL,
    "testName" TEXT NOT NULL,
    "testDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "laborants_userId_key" ON "laborants"("userId");

-- AddForeignKey
ALTER TABLE "laborants" ADD CONSTRAINT "laborants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_files" ADD CONSTRAINT "medical_files_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_files" ADD CONSTRAINT "medical_files_laborantId_fkey" FOREIGN KEY ("laborantId") REFERENCES "laborants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
