import { validateRequestUpdate } from "~~/shared/types";
import { prisma } from "~~/server/utils/db";
import {
  applyOrderedChildren,
  clampIndex,
  ensureCollectionAccess,
  ensureFolderAccess,
  getOrderedChildren,
  reorderChildren,
  requireCurrentUser,
} from "~~/server/utils/sidebar";

export default defineEventHandler(async (event) => {
  const user = await requireCurrentUser(event);

  const requestId = getRouterParam(event, "id");

  if (!requestId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Request ID is required",
    });
  }

  const body = await readBody(event);
  const data = validateRequestUpdate(body);

  const existing = await prisma.request.findFirst({
    where: {
      id: requestId,
      collection: {
        userCollections: {
          some: {
            userId: user.id,
          },
        },
      },
    },
  });

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: "Request not found",
    });
  }

  // Fields other than parent/index
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.url !== undefined) payload.url = data.url;
  if (data.method !== undefined) payload.method = data.method;
  if (data.body_type !== undefined) payload.body_type = data.body_type;
  if (data.body !== undefined) payload.body = data.body;
  if (data.description !== undefined) payload.description = data.description;
  if (data.authorizationId !== undefined) payload.authorizationId = data.authorizationId;
  if (data.headers !== undefined) payload.headers = data.headers;

  const newCollectionId = data.collectionId ?? existing.collectionId;
  const newFolderId =
    data.folderId !== undefined ? data.folderId ?? null : existing.folderId;

  const requestedIndex = data.index ?? existing.index;

  const sameParent =
    existing.collectionId === newCollectionId &&
    existing.folderId === newFolderId;

  await prisma.$transaction(async (tx) => {
    await ensureCollectionAccess(tx, user.id, newCollectionId);

    if (newFolderId) {
      await ensureFolderAccess(tx, user.id, newFolderId, newCollectionId);
    }

    if (sameParent) {
      const siblings = await getOrderedChildren(tx, {
        collectionId: existing.collectionId,
        parentFolderId: existing.folderId,
      });
      const orderedSiblings = reorderChildren(
        siblings,
        existing.id,
        clampIndex(requestedIndex, siblings.length - 1),
      );

      await applyOrderedChildren(tx, orderedSiblings, {
        id: existing.id,
        type: "request",
        data: payload,
      });
    } else {
      const oldParent = {
        collectionId: existing.collectionId,
        parentFolderId: existing.folderId,
      };
      const newParent = {
        collectionId: newCollectionId,
        parentFolderId: newFolderId,
      };

      const oldSiblings = (await getOrderedChildren(tx, oldParent)).filter(
        (child) => !(child.type === "request" && child.id === existing.id),
      );
      await applyOrderedChildren(tx, oldSiblings);

      const newSiblings = await getOrderedChildren(tx, newParent);
      const insertIndex = clampIndex(requestedIndex, newSiblings.length);
      const reorderedSiblings = [...newSiblings];
      reorderedSiblings.splice(insertIndex, 0, {
        id: existing.id,
        type: "request",
        index: insertIndex,
        createdAt: existing.createdAt,
      });

      await applyOrderedChildren(tx, reorderedSiblings, {
        id: existing.id,
        type: "request",
        data: {
          ...payload,
          collectionId: newCollectionId,
          folderId: newFolderId,
        },
      });
    }
  });

  return prisma.request.findUnique({ where: { id: requestId } });
});
