/*
  Warnings:

  - You are about to drop the column `avg` on the `service` table. All the data in the column will be lost.
  - You are about to drop the column `businessId` on the `service` table. All the data in the column will be lost.
  - You are about to drop the column `cost` on the `service` table. All the data in the column will be lost.
  - You are about to drop the column `lastRec` on the `service` table. All the data in the column will be lost.
  - You are about to drop the column `lastSold` on the `service` table. All the data in the column will be lost.
  - You are about to drop the column `lastYr` on the `service` table. All the data in the column will be lost.
  - You are about to drop the column `list` on the `service` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `service` table. All the data in the column will be lost.
  - You are about to drop the column `max` on the `service` table. All the data in the column will be lost.
  - You are about to drop the column `min` on the `service` table. All the data in the column will be lost.
  - You are about to drop the column `mrg` on the `service` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `service` table. All the data in the column will be lost.
  - You are about to drop the column `qty` on the `service` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `service` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `service` table. All the data in the column will be lost.
  - You are about to drop the column `ytd` on the `service` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code]` on the table `Service` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `Service` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `service` DROP FOREIGN KEY `Service_businessId_fkey`;

-- DropIndex
DROP INDEX `Service_businessId_fkey` ON `service`;

-- AlterTable
ALTER TABLE `service` DROP COLUMN `avg`,
    DROP COLUMN `businessId`,
    DROP COLUMN `cost`,
    DROP COLUMN `lastRec`,
    DROP COLUMN `lastSold`,
    DROP COLUMN `lastYr`,
    DROP COLUMN `list`,
    DROP COLUMN `location`,
    DROP COLUMN `max`,
    DROP COLUMN `min`,
    DROP COLUMN `mrg`,
    DROP COLUMN `price`,
    DROP COLUMN `qty`,
    DROP COLUMN `rating`,
    DROP COLUMN `value`,
    DROP COLUMN `ytd`,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL;

-- CreateTable
CREATE TABLE `PartOffering` (
    `id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `price` DOUBLE NOT NULL DEFAULT 0.0,
    `qty` INTEGER NULL,
    `location` VARCHAR(191) NULL,
    `list` DOUBLE NULL,
    `cost` DOUBLE NULL,
    `value` DOUBLE NULL,
    `min` INTEGER NULL,
    `max` INTEGER NULL,
    `avg` DOUBLE NULL,
    `lastRec` VARCHAR(191) NULL,
    `lastSold` VARCHAR(191) NULL,
    `mrg` DOUBLE NULL,
    `ytd` DOUBLE NULL,
    `lastYr` DOUBLE NULL,
    `businessId` VARCHAR(191) NOT NULL,
    `serviceId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `PartOffering_businessId_serviceId_key`(`businessId`, `serviceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Service_code_key` ON `Service`(`code`);

-- AddForeignKey
ALTER TABLE `PartOffering` ADD CONSTRAINT `PartOffering_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `Business`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PartOffering` ADD CONSTRAINT `PartOffering_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `Service`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
