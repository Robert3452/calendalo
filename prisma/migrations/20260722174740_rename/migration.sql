/*
  Warnings:

  - You are about to drop the column `timezone` on the `accounts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "accounts" DROP COLUMN "timezone",
ADD COLUMN     "timeZone" TEXT NOT NULL DEFAULT 'UTC';
