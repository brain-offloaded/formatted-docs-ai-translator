/*
  Warnings:

  - You are about to drop the column `createdAt` on the `app_settings` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `app_settings` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_app_settings" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_app_settings" ("key", "value") SELECT "key", "value" FROM "app_settings";
DROP TABLE "app_settings";
ALTER TABLE "new_app_settings" RENAME TO "app_settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
