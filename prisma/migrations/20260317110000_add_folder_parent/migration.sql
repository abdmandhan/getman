ALTER TABLE "Folder" ADD COLUMN "parentFolderId" TEXT;

ALTER TABLE "Folder"
ADD CONSTRAINT "Folder_parentFolderId_fkey"
FOREIGN KEY ("parentFolderId") REFERENCES "Folder"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
