import { prisma } from "~~/server/utils/db";
import { validateRequest } from "~~/shared/types";
import {
  ensureCollectionAccess,
  ensureFolderAccess,
  getOrderedChildren,
  requireCurrentUser,
} from "~~/server/utils/sidebar";

export default defineEventHandler(async (event) => {
  const requestBody = await readBody(event);

  const { name, url, method, body_type, body, collectionId, folderId, description, authorizationId } = validateRequest(requestBody);

  const user = await requireCurrentUser(event);
  const collection = await ensureCollectionAccess(prisma, user.id, collectionId);

  // if folderId is provided, ensure it belongs to the same user & collection
  if (folderId) {
    await ensureFolderAccess(prisma, user.id, folderId, collection.id);
  }

  const siblings = await getOrderedChildren(prisma, {
    collectionId: collection.id,
    parentFolderId: folderId ?? null,
  });

  const request = await prisma.request.create({
    data: {
      index: siblings.length,
      name,
      url,
      method,
      description,
      collectionId: collection.id,
      folderId: folderId ?? null,
      body_type,
      body,
      authorizationId: authorizationId ?? null,
    },
  });

  return request;
});
