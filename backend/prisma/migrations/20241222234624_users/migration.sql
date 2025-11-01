/*
  Warnings:

  - You are about to drop the `_SnackMeals` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `diet_histories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `diet_plans` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `meal_days` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `meals` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `personal_infos` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_SnackMeals" DROP CONSTRAINT "_SnackMeals_A_fkey";

-- DropForeignKey
ALTER TABLE "_SnackMeals" DROP CONSTRAINT "_SnackMeals_B_fkey";

-- DropForeignKey
ALTER TABLE "diet_histories" DROP CONSTRAINT "diet_histories_userId_fkey";

-- DropForeignKey
ALTER TABLE "diet_plans" DROP CONSTRAINT "diet_plans_userId_fkey";

-- DropForeignKey
ALTER TABLE "meal_days" DROP CONSTRAINT "meal_days_breakfastId_fkey";

-- DropForeignKey
ALTER TABLE "meal_days" DROP CONSTRAINT "meal_days_dietPlanId_fkey";

-- DropForeignKey
ALTER TABLE "meal_days" DROP CONSTRAINT "meal_days_dinnerId_fkey";

-- DropForeignKey
ALTER TABLE "meal_days" DROP CONSTRAINT "meal_days_lunchId_fkey";

-- DropForeignKey
ALTER TABLE "personal_infos" DROP CONSTRAINT "personal_infos_userId_fkey";

-- DropTable
DROP TABLE "_SnackMeals";

-- DropTable
DROP TABLE "diet_histories";

-- DropTable
DROP TABLE "diet_plans";

-- DropTable
DROP TABLE "meal_days";

-- DropTable
DROP TABLE "meals";

-- DropTable
DROP TABLE "personal_infos";

-- DropEnum
DROP TYPE "DayOfWeek";

-- DropEnum
DROP TYPE "DietPlanStatus";
