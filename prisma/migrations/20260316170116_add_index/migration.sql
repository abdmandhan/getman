-- AlterTable
ALTER TABLE "Collection" ADD COLUMN     "index" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Folder" ADD COLUMN     "index" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "index" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "EnvironmentVariable_environmentId_key_idx" ON "EnvironmentVariable"("environmentId", "key");
