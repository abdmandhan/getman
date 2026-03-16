import { validateCollectionUpdate } from "~~/shared/types";
import { prisma } from "~~/server/utils/db";
import {
  clampIndex,
  reorderChildren,
  requireCurrentUser,
} from "~~/server/utils/sidebar";

export default defineEventHandler(async (event) => {
  const user = await requireCurrentUser(event);
  const collectionId = getRouterParam(event, "id");

  if (!collectionId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Collection ID is required",
    });
  }

  const body = await readBody(event);
  const data = validateCollectionUpdate(body);

  const existing = await prisma.collection.findFirst({
    where: {
      id: collectionId,
      userCollections: {
        some: {
          userId: user.id,
        },
      },
    },
  });

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: "Collection not found",
    });
  }

  if (data.index === undefined) {
    return existing;
  }

  const requestedIndex = data.index;

  await prisma.$transaction(async (tx) => {
    const collections = await tx.collection.findMany({
      where: {
        userCollections: {
          some: {
            userId: user.id,
          },
        },
      },
      select: {
        id: true,
      },
      orderBy: [{ index: "asc" }, { createdAt: "asc" }],
    });

    const orderedCollections = reorderChildren(
      collections,
      existing.id,
      clampIndex(requestedIndex, collections.length - 1),
    );

    for (let index = 0; index < orderedCollections.length; index += 1) {
      const collection = orderedCollections[index];

      if (!collection) {
        continue;
      }

      await tx.collection.update({
        where: { id: collection.id },
        data: { index },
      });
    }
  });

  return prisma.collection.findUnique({
    where: { id: collectionId },
  });
});
