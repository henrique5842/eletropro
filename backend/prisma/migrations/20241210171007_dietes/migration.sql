-- CreateTable
CREATE TABLE "diet_plans" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "meal" TEXT NOT NULL,
    "ingredients" TEXT NOT NULL,

    CONSTRAINT "diet_plans_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "diet_plans" ADD CONSTRAINT "diet_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
