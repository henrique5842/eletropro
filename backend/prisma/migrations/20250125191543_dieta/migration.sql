-- CreateTable
CREATE TABLE "diet_plans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "age" INTEGER,
    "sex" TEXT,
    "healthGoal" TEXT,
    "goalTimeframe" TEXT,
    "physicalActivityFrequency" TEXT,
    "exerciseType" TEXT,
    "dietType" TEXT,
    "preferredFoods" TEXT[],
    "avoidedFoods" TEXT[],
    "foodAllergies" TEXT[],
    "healthConditions" TEXT[],
    "mealsPerDay" INTEGER,
    "mealSchedule" TEXT,
    "cookingPreference" TEXT,
    "opennessToNewFoods" BOOLEAN,
    "dietAdherenceLevel" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diet_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_diets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dietDuration" INTEGER NOT NULL DEFAULT 7,
    "totalCalories" DOUBLE PRECISION,
    "macronutrients" JSONB,
    "dietDays" JSONB[],
    "proteinPercentage" DOUBLE PRECISION,
    "carbPercentage" DOUBLE PRECISION,
    "fatPercentage" DOUBLE PRECISION,
    "estimatedWeightLoss" DOUBLE PRECISION,
    "recommendedWaterIntake" DOUBLE PRECISION,
    "dietGoal" TEXT,
    "specialInstructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generated_diets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "diet_plans_userId_key" ON "diet_plans"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "generated_diets_userId_key" ON "generated_diets"("userId");

-- AddForeignKey
ALTER TABLE "diet_plans" ADD CONSTRAINT "diet_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_diets" ADD CONSTRAINT "generated_diets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
