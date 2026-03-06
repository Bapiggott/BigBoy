/*
  Warnings:

  - The primary key for the `favorites` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `promoCodeId` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `avatarUrl` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `googleSub` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `audit_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `promo_codes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sessions` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,menuItemId]` on the table `favorites` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `favorites` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Made the column `passwordHash` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_userId_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_promoCodeId_fkey";

-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_userId_fkey";

-- DropIndex
DROP INDEX "users_googleSub_key";

-- AlterTable
ALTER TABLE "favorites" DROP CONSTRAINT "favorites_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "favorites_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "promoCodeId";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "avatarUrl",
DROP COLUMN "googleSub",
DROP COLUMN "name",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER',
ALTER COLUMN "passwordHash" SET NOT NULL;

-- DropTable
DROP TABLE "audit_logs";

-- DropTable
DROP TABLE "promo_codes";

-- DropTable
DROP TABLE "sessions";

-- DropEnum
DROP TYPE "PromoType";

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_userId_menuItemId_key" ON "favorites"("userId", "menuItemId");

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
