-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('PENDING', 'REPLIED');

-- CreateTable
CREATE TABLE "contact_issues" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "IssueStatus" NOT NULL DEFAULT 'PENDING',
    "replyMessage" TEXT,
    "repliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_issues_pkey" PRIMARY KEY ("id")
);
