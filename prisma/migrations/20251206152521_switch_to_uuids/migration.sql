/*
  Warnings:

  - The primary key for the `Car` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `CarImage` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Rental` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Car" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "pricePerDay" REAL NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "imageUrl" TEXT,
    "fuelType" TEXT,
    "transmission" TEXT,
    "seats" INTEGER,
    "engine" TEXT,
    "mileage" INTEGER,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);
INSERT INTO "new_Car" ("available", "color", "createdAt", "deletedAt", "description", "engine", "fuelType", "id", "imageUrl", "make", "mileage", "model", "pricePerDay", "seats", "transmission", "updatedAt", "year") SELECT "available", "color", "createdAt", "deletedAt", "description", "engine", "fuelType", "id", "imageUrl", "make", "mileage", "model", "pricePerDay", "seats", "transmission", "updatedAt", "year" FROM "Car";
DROP TABLE "Car";
ALTER TABLE "new_Car" RENAME TO "Car";
CREATE INDEX "Car_available_idx" ON "Car"("available");
CREATE INDEX "Car_make_idx" ON "Car"("make");
CREATE TABLE "new_CarImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "carId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CarImage_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CarImage" ("carId", "createdAt", "id", "imageUrl", "isPrimary", "updatedAt") SELECT "carId", "createdAt", "id", "imageUrl", "isPrimary", "updatedAt" FROM "CarImage";
DROP TABLE "CarImage";
ALTER TABLE "new_CarImage" RENAME TO "CarImage";
CREATE INDEX "CarImage_carId_idx" ON "CarImage"("carId");
CREATE TABLE "new_Rental" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "totalPrice" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "userId" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Rental_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Rental_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Rental" ("carId", "createdAt", "deletedAt", "endDate", "id", "startDate", "status", "totalPrice", "updatedAt", "userId") SELECT "carId", "createdAt", "deletedAt", "endDate", "id", "startDate", "status", "totalPrice", "updatedAt", "userId" FROM "Rental";
DROP TABLE "Rental";
ALTER TABLE "new_Rental" RENAME TO "Rental";
CREATE INDEX "Rental_userId_idx" ON "Rental"("userId");
CREATE INDEX "Rental_carId_idx" ON "Rental"("carId");
CREATE INDEX "Rental_status_idx" ON "Rental"("status");
CREATE UNIQUE INDEX "Rental_userId_carId_startDate_key" ON "Rental"("userId", "carId", "startDate");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'GUEST',
    "imageUrl" TEXT,
    "drivingLicenceNumber" TEXT,
    "refreshToken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);
INSERT INTO "new_User" ("createdAt", "deletedAt", "drivingLicenceNumber", "email", "id", "imageUrl", "name", "password", "refreshToken", "role", "updatedAt") SELECT "createdAt", "deletedAt", "drivingLicenceNumber", "email", "id", "imageUrl", "name", "password", "refreshToken", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_idx" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
