/*
  Warnings:

  - You are about to drop the `notes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `notes` DROP FOREIGN KEY `notes_userId_fkey`;

-- AlterTable
ALTER TABLE `cvs` ADD COLUMN `certificates` VARCHAR(191) NULL,
    ADD COLUMN `links` VARCHAR(191) NULL,
    ADD COLUMN `references` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `notes`;
