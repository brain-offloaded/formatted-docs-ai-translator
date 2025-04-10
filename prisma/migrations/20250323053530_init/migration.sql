/*
  Warnings:

  - The primary key for the `Translation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `lastAccessed` on the `Translation` table. All the data in the column will be lost.
  - You are about to drop the column `sourceText` on the `Translation` table. All the data in the column will be lost.
  - You are about to drop the column `translation` on the `Translation` table. All the data in the column will be lost.
  - You are about to alter the column `createdAt` on the `Translation` table. The data in that column could be lost. The data in that column will be cast from `Int` to `DateTime`.
  - Added the required column `id` to the `Translation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `source` to the `Translation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `target` to the `Translation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Translation` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Translation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "source" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Translation" ("createdAt") SELECT "createdAt" FROM "Translation";
DROP TABLE "Translation";
ALTER TABLE "new_Translation" RENAME TO "Translation";
CREATE UNIQUE INDEX "Translation_source_key" ON "Translation"("source");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
