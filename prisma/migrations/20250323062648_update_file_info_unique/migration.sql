/*
  Warnings:

  - A unique constraint covering the columns `[filePath]` on the table `FileInfo` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "FileInfo_filePath_key" ON "FileInfo"("filePath");
