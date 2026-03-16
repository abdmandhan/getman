import { validateFolderUpdate } from "~~/shared/types";
import { prisma } from "~~/server/utils/db";
import {
  applyOrderedChildren,
  clampIndex,
  ensureCollectionAccess,
  ensureFolderAccess,
  getDescendantFolderIds,
  getOrderedChildren,
  reorderChildren,
  requireCurrentUser,
} from "~~/server/utils/sidebar";

export default defineEventHandler(async (event) => {
  const user = await requireCurrentUser(event);
  const folderId = getRouterParam(event, "id");

  if (!folderId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Folder ID is required",
    });
  }

  const body = await readBody(event);
  const data = validateFolderUpdate(body);

  const existing = await prisma.folder.findFirst({
    where: {
      id: folderId,
      userId: user.id,
    },
  });

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: "Folder not found",
    });
  }

  const targetCollectionId = data.collectionId ?? existing.collectionId;
  const targetParentFolderId =
    data.parentFolderId !== undefined
      ? data.parentFolderId ?? null
      : existing.parentFolderId;

  if (targetParentFolderId === existing.id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Folder cannot be moved into itself",
    });
  }

  const requestedIndex = data.index ?? existing.index;

  await prisma.$transaction(async (tx) => {
    await ensureCollectionAccess(tx, user.id, targetCollectionId);

    if (targetParentFolderId) {
      await ensureFolderAccess(tx, user.id, targetParentFolderId, targetCollectionId);
    }

    const descendantIds = await getDescendantFolderIds(tx, user.id, existing.id);

    if (targetParentFolderId && descendantIds.includes(targetParentFolderId)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Folder cannot be moved into one of its descendants",
      });
    }

    const oldParent = {
      collectionId: existing.collectionId,
      parentFolderId: existing.parentFolderId,
    };
    const newParent = {
      collectionId: targetCollectionId,
      parentFolderId: targetParentFolderId,
    };
    const sameParent =
      oldParent.collectionId === newParent.collectionId &&
      oldParent.parentFolderId === newParent.parentFolderId;

    if (sameParent) {
      const siblings = await getOrderedChildren(tx, oldParent);
      const orderedSiblings = reorderChildren(
        siblings,
        existing.id,
        clampIndex(requestedIndex, siblings.length - 1),
      );

      await applyOrderedChildren(tx, orderedSiblings, {
        id: existing.id,
        type: "folder",
        data: {},
      });

      return;
    }

    const oldSiblings = (await getOrderedChildren(tx, oldParent)).filter(
      (child) => !(child.type === "folder" && child.id === existing.id),
    );
    await applyOrderedChildren(tx, oldSiblings);

    const newSiblings = await getOrderedChildren(tx, newParent);
    const insertIndex = clampIndex(requestedIndex, newSiblings.length);
    const reorderedSiblings = [...newSiblings];
    reorderedSiblings.splice(insertIndex, 0, {
      id: existing.id,
      type: "folder",
      index: insertIndex,
      createdAt: existing.createdAt,
    });

    await applyOrderedChildren(tx, reorderedSiblings, {
      id: existing.id,
      type: "folder",
      data: {
        collectionId: targetCollectionId,
        parentFolderId: targetParentFolderId,
      },
    });

    if (targetCollectionId !== existing.collectionId) {
      const nestedFolderIds = descendantIds.filter((id) => id !== existing.id);

      if (nestedFolderIds.length) {
        await tx.folder.updateMany({
          where: {
            id: {
              in: nestedFolderIds,
            },
          },
          data: {
            collectionId: targetCollectionId,
          },
        });
      }

      await tx.request.updateMany({
        where: {
          folderId: {
            in: descendantIds,
          },
        },
        data: {
          collectionId: targetCollectionId,
        },
      });
    }
  });

  return prisma.folder.findUnique({
    where: { id: folderId },
  });
});
