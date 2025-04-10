/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `Translation` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Translation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "source" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fileInfoId" INTEGER,
    CONSTRAINT "Translation_fileInfoId_fkey" FOREIGN KEY ("fileInfoId") REFERENCES "FileInfo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Translation" ("createdAt", "fileInfoId", "id", "source", "target") SELECT "createdAt", "fileInfoId", "id", "source", "target" FROM "Translation";
DROP TABLE "Translation";
ALTER TABLE "new_Translation" RENAME TO "Translation";
CREATE UNIQUE INDEX "Translation_source_key" ON "Translation"("source");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
