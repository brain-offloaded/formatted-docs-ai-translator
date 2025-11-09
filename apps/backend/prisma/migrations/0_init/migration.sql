-- CreateTable
CREATE TABLE "app_settings" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "cache_tag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "example_preset" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "examples" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "log" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "context" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT
);

-- CreateTable
CREATE TABLE "migrations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "timestamp" BIGINT NOT NULL,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "prompt_presets" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "translation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "source" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_accessed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cache_tag_id" INTEGER NOT NULL,
    CONSTRAINT "translation_cache_tag_id_fkey" FOREIGN KEY ("cache_tag_id") REFERENCES "cache_tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    "cache_tag_id" INTEGER NOT NULL,
    CONSTRAINT "translation_history_cache_tag_id_fkey" FOREIGN KEY ("cache_tag_id") REFERENCES "cache_tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "translation_history_translation_id_fkey" FOREIGN KEY ("translation_id") REFERENCES "translation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "IDX_cache_tag_name" ON "cache_tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "IDX_13598c5555dba81077a3cf8ba4" ON "example_preset"("name");

-- CreateIndex
CREATE INDEX "IDX_d8b227f0e8c205a131e303f3ce" ON "log"("timestamp");

-- CreateIndex
CREATE INDEX "IDX_584b536b49e53ac81beb39a177" ON "log"("level");

-- CreateIndex
Pragma writable_schema=1;
CREATE UNIQUE INDEX "sqlite_autoindex_prompt_presets_1" ON "prompt_presets"("name");
Pragma writable_schema=0;

-- CreateIndex
CREATE INDEX "IDX_90098ba907c41e91fd6c745574" ON "translation"("last_accessed_at");

-- CreateIndex
CREATE UNIQUE INDEX "IDX_translation_source_cache_tag" ON "translation"("source", "cache_tag_id");

-- CreateIndex
CREATE INDEX "IDX_translation_history_cache_tag" ON "translation_history"("cache_tag_id");

-- CreateIndex
CREATE INDEX "IDX_translation_history_source" ON "translation_history"("source");

-- CreateIndex
CREATE INDEX "IDX_translation_history_created_at" ON "translation_history"("created_at");

-- CreateIndex
CREATE INDEX "IDX_translation_history_translation_id" ON "translation_history"("translation_id");

