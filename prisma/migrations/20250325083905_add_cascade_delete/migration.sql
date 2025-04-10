-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_translation_history" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "translation_id" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "error" TEXT,
    "model" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "translation_history_translation_id_fkey" FOREIGN KEY ("translation_id") REFERENCES "translation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_translation_history" ("created_at", "error", "id", "model", "source", "success", "target", "translation_id") SELECT "created_at", "error", "id", "model", "source", "success", "target", "translation_id" FROM "translation_history";
DROP TABLE "translation_history";
ALTER TABLE "new_translation_history" RENAME TO "translation_history";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
