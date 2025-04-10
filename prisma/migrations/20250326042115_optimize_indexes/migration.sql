-- CreateIndex
CREATE INDEX "file_info_file_name_idx" ON "file_info"("file_name");

-- CreateIndex
CREATE INDEX "log_level_idx" ON "log"("level");

-- CreateIndex
CREATE INDEX "log_timestamp_idx" ON "log"("timestamp");

-- CreateIndex
CREATE INDEX "translation_last_accessed_at_idx" ON "translation"("last_accessed_at");

-- CreateIndex
CREATE INDEX "translation_file_info_id_idx" ON "translation"("file_info_id");

-- CreateIndex
CREATE INDEX "translation_history_translation_id_idx" ON "translation_history"("translation_id");

-- CreateIndex
CREATE INDEX "translation_history_created_at_idx" ON "translation_history"("created_at");

-- CreateIndex
CREATE INDEX "translation_history_source_idx" ON "translation_history"("source");
