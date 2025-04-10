-- DropIndex
DROP INDEX "file_info_file_name_idx";

-- DropIndex
DROP INDEX "translation_success_idx";

-- DropIndex
DROP INDEX "translation_last_accessed_at_idx";

-- DropIndex
DROP INDEX "translation_history_success_idx";

-- DropIndex
DROP INDEX "translation_history_created_at_idx";

-- DropIndex
DROP INDEX "translation_history_translation_id_idx";

-- CreateTable
CREATE TABLE "log" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "context" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT
);
