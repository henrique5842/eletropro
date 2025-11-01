-- AlterTable
ALTER TABLE "users" ADD COLUMN     "resetCode" TEXT,
ADD COLUMN     "resetCodeExpires" TIMESTAMP(3);
