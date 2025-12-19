-- CreateTable
CREATE TABLE "translator_model_presets" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "model_provider" TEXT NOT NULL,
    "base_url" TEXT,
    "api_key" TEXT NOT NULL,
    "model_name" TEXT NOT NULL,
    "requests_per_minute" INTEGER NOT NULL,
    "max_output_token_count" INTEGER NOT NULL,
    "max_concurrent_requests" INTEGER NOT NULL,
    "use_thinking" BOOLEAN NOT NULL DEFAULT false,
    "set_thinking_budget" BOOLEAN NOT NULL DEFAULT false,
    "thinking_budget" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "IDX_translator_model_preset_name" ON "translator_model_presets"("name");
