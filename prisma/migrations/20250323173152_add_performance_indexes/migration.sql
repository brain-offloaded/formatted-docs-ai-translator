-- DropIndex
DROP INDEX "translation_file_info_id_idx";

-- CreateIndex
CREATE INDEX "translation_success_idx" ON "translation"("success");

-- CreateIndex
CREATE INDEX "translation_history_success_idx" ON "translation_history"("success");
