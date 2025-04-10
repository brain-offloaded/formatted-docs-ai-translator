-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_translation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "source" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_accessed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "file_info_id" INTEGER,
    CONSTRAINT "translation_file_info_id_fkey" FOREIGN KEY ("file_info_id") REFERENCES "file_info" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_translation" ("created_at", "file_info_id", "id", "last_accessed_at", "source", "target") SELECT "created_at", "file_info_id", "id", "last_accessed_at", "source", "target" FROM "translation";
DROP TABLE "translation";
ALTER TABLE "new_translation" RENAME TO "translation";
CREATE UNIQUE INDEX "translation_source_key" ON "translation"("source");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
