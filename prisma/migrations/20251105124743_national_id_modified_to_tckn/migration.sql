/*
  Warnings:

  - You are about to drop the column `nationalId` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tckn]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tckn` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."users_nationalId_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "nationalId",
ADD COLUMN     "tckn" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_tckn_key" ON "users"("tckn");
