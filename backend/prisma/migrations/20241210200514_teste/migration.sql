/*
  Warnings:

  - The primary key for the `diet_plans` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `dayOfWeek` on the `diet_plans` table. All the data in the column will be lost.
  - You are about to drop the column `ingredients` on the `diet_plans` table. All the data in the column will be lost.
  - You are about to drop the column `meal` on the `diet_plans` table. All the data in the column will be lost.
  - Added the required column `endDate` to the `diet_plans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `diet_plans` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DietPlanStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- AlterTable
ALTER TABLE "diet_plans" DROP CONSTRAINT "diet_plans_pkey",
DROP COLUMN "dayOfWeek",
DROP COLUMN "ingredients",
DROP COLUMN "meal",
ADD COLUMN     "dietDescription" TEXT,
ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "mealsPerDay" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "status" "DietPlanStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "weeklyBudget" DOUBLE PRECISION,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "diet_plans_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "diet_plans_id_seq";

-- CreateTable
CREATE TABLE "personal_infos" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "sex" TEXT NOT NULL,
    "healthObjective" TEXT,
    "physicalActivityLevel" TEXT,
    "dietType" TEXT,
    "healthConditions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personal_infos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_days" (
    "id" TEXT NOT NULL,
    "dietPlanId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "breakfastId" TEXT,
    "lunchId" TEXT,
    "dinnerId" TEXT,

    CONSTRAINT "meal_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meals" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ingredients" TEXT[],
    "calories" DOUBLE PRECISION,
    "proteins" DOUBLE PRECISION,
    "carbohydrates" DOUBLE PRECISION,
    "fats" DOUBLE PRECISION,
    "preparationInstructions" TEXT,

    CONSTRAINT "meals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diet_histories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dietPlanId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "totalCompletionRate" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diet_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SnackMeals" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SnackMeals_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "personal_infos_userId_key" ON "personal_infos"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "meal_days_dietPlanId_dayOfWeek_key" ON "meal_days"("dietPlanId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "_SnackMeals_B_index" ON "_SnackMeals"("B");

-- AddForeignKey
ALTER TABLE "personal_infos" ADD CONSTRAINT "personal_infos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_days" ADD CONSTRAINT "meal_days_dietPlanId_fkey" FOREIGN KEY ("dietPlanId") REFERENCES "diet_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_days" ADD CONSTRAINT "meal_days_breakfastId_fkey" FOREIGN KEY ("breakfastId") REFERENCES "meals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_days" ADD CONSTRAINT "meal_days_lunchId_fkey" FOREIGN KEY ("lunchId") REFERENCES "meals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_days" ADD CONSTRAINT "meal_days_dinnerId_fkey" FOREIGN KEY ("dinnerId") REFERENCES "meals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diet_histories" ADD CONSTRAINT "diet_histories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SnackMeals" ADD CONSTRAINT "_SnackMeals_A_fkey" FOREIGN KEY ("A") REFERENCES "meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SnackMeals" ADD CONSTRAINT "_SnackMeals_B_fkey" FOREIGN KEY ("B") REFERENCES "meal_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;
