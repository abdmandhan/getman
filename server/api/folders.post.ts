import { z } from "zod";
import { prisma } from "~~/server/utils/db";
import {
  ensureCollectionAccess,
  getOrderedChildren,
  requireCurrentUser,
} from "~~/server/utils/sidebar";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const { name, collectionId } = z
    .object({
      name: z.string().min(1),
      collectionId: z.string().min(1),
    })
    .parse(body);

  const user = await requireCurrentUser(event);
  const collection = await ensureCollectionAccess(prisma, user.id, collectionId);
  const siblings = await getOrderedChildren(prisma, {
    collectionId: collection.id,
    parentFolderId: null,
  });

  const folder = await prisma.folder.create({
    data: {
      index: siblings.length,
      name,
      userId: user.id,
      collectionId: collection.id,
      parentFolderId: null,
    },
  });

  return folder;
});
