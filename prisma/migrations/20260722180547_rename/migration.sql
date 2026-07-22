/*
  Warnings:

  - You are about to drop the column `timeZone` on the `accounts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "accounts" DROP COLUMN "timeZone",
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'UTC';
