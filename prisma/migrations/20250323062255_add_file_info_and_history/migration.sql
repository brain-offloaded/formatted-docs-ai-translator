-- CreateTable
CREATE TABLE "FileInfo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TranslationHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "translationId" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "error" TEXT,
    "model" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TranslationHistory_translationId_fkey" FOREIGN KEY ("translationId") REFERENCES "Translation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Translation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "source" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "fileInfoId" INTEGER,
    CONSTRAINT "Translation_fileInfoId_fkey" FOREIGN KEY ("fileInfoId") REFERENCES "FileInfo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Translation" ("createdAt", "id", "source", "target", "updatedAt") SELECT "createdAt", "id", "source", "target", "updatedAt" FROM "Translation";
DROP TABLE "Translation";
ALTER TABLE "new_Translation" RENAME TO "Translation";
CREATE UNIQUE INDEX "Translation_source_key" ON "Translation"("source");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
