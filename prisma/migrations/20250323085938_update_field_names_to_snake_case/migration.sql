/*
  Warnings:

  - You are about to drop the `FileInfo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Translation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TranslationHistory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "FileInfo";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Translation";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "TranslationHistory";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "translation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "source" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_accessed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "file_info_id" INTEGER,
    CONSTRAINT "translation_file_info_id_fkey" FOREIGN KEY ("file_info_id") REFERENCES "file_info" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "file_info" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "translation_history" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "translation_id" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "error" TEXT,
    "model" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "translation_history_translation_id_fkey" FOREIGN KEY ("translation_id") REFERENCES "translation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "translation_source_key" ON "translation"("source");

-- CreateIndex
CREATE UNIQUE INDEX "file_info_file_path_key" ON "file_info"("file_path");
