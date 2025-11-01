-- CreateTable
CREATE TABLE "PetPhoto" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PetPhoto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PetPhoto" ADD CONSTRAINT "PetPhoto_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
