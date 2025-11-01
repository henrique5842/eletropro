/*
  Warnings:

  - You are about to drop the column `phoneNumber` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `MissingPet` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Pet` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PetPhoto` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "MissingPet" DROP CONSTRAINT "MissingPet_petId_fkey";

-- DropForeignKey
ALTER TABLE "Pet" DROP CONSTRAINT "Pet_userId_fkey";

-- DropForeignKey
ALTER TABLE "PetPhoto" DROP CONSTRAINT "PetPhoto_petId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "phoneNumber";

-- DropTable
DROP TABLE "MissingPet";

-- DropTable
DROP TABLE "Pet";

-- DropTable
DROP TABLE "PetPhoto";
