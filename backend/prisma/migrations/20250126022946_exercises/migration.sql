/*
  Warnings:

  - You are about to drop the `generated_workouts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `workout_plans` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "generated_workouts" DROP CONSTRAINT "generated_workouts_userId_fkey";

-- DropForeignKey
ALTER TABLE "workout_plans" DROP CONSTRAINT "workout_plans_userId_fkey";

-- DropTable
DROP TABLE "generated_workouts";

-- DropTable
DROP TABLE "workout_plans";

-- CreateTable
CREATE TABLE "exercises" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "age" INTEGER,
    "sex" TEXT,
    "fitnessGoal" TEXT,
    "goalTimeframe" TEXT,
    "physicalActivityFrequency" TEXT,
    "workoutType" TEXT,
    "preferredExercises" TEXT[],
    "avoidedExercises" TEXT[],
    "healthConditions" TEXT[],
    "workoutDaysPerWeek" INTEGER,
    "workoutDuration" INTEGER,
    "opennessToNewExercises" BOOLEAN,
    "adherenceLevel" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_exercises" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workoutDuration" INTEGER NOT NULL DEFAULT 7,
    "totalCaloriesBurned" DOUBLE PRECISION,
    "workoutTypes" JSONB,
    "workoutDays" JSONB[],
    "exercises" JSONB,
    "estimatedCaloriesBurned" DOUBLE PRECISION,
    "recommendedRestTime" DOUBLE PRECISION,
    "workoutGoal" TEXT,
    "specialInstructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generated_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exercises_userId_key" ON "exercises"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "generated_exercises_userId_key" ON "generated_exercises"("userId");

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_exercises" ADD CONSTRAINT "generated_exercises_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
