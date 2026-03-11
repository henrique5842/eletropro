/*
  Warnings:

  - You are about to drop the `Password` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Password" DROP CONSTRAINT "Password_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "cnpj" TEXT,
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "phone" TEXT;

-- DropTable
DROP TABLE "Password";
