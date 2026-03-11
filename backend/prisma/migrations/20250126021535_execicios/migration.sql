-- CreateTable
CREATE TABLE "workout_plans" (
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

    CONSTRAINT "workout_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_workouts" (
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

    CONSTRAINT "generated_workouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workout_plans_userId_key" ON "workout_plans"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "generated_workouts_userId_key" ON "generated_workouts"("userId");

-- AddForeignKey
ALTER TABLE "workout_plans" ADD CONSTRAINT "workout_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_workouts" ADD CONSTRAINT "generated_workouts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
