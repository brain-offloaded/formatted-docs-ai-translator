-- CreateTable
CREATE TABLE "Translation" (
    "sourceText" TEXT NOT NULL PRIMARY KEY,
    "translation" TEXT NOT NULL,
    "createdAt" INTEGER NOT NULL,
    "lastAccessed" INTEGER NOT NULL
);
