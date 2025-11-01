/*
  Warnings:

  - Added the required column `updatedAt` to the `budget_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "budget_items" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
