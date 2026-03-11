import { z } from "zod";
import { prisma } from "~~/server/utils/db";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);

  if (!session?.user?.username) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const body = await readBody(event);

  const { name, url, method, collectionId, folderId, description } = z
    .object({
      name: z.string().min(1),
      url: z.string().min(1),
      method: z.string().min(1),
      collectionId: z.string().min(1),
      folderId: z.string().optional().nullable(),
      description: z.string().optional(),
    })
    .parse(body);

  const user = await prisma.user.findFirst({
    where: {
      email: session.user.username,
    },
    include: {
      userCollections: true,
    },
  });

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "User not found",
    });
  }

  // verify the collection belongs to this user
  const collection = await prisma.collection.findFirst({
    where: {
      id: collectionId,
      userCollections: {
        some: {
          userId: user.id,
        },
      },
    },
  });

  if (!collection) {
    throw createError({
      statusCode: 404,
      statusMessage: "Collection not found",
    });
  }

  // if folderId is provided, ensure it belongs to the same user & collection
  if (folderId) {
    const folder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        userId: user.id,
        collectionId: collection.id,
      },
    });

    if (!folder) {
      throw createError({
        statusCode: 404,
        statusMessage: "Folder not found",
      });
    }
  }

  const request = await prisma.request.create({
    data: {
      name,
      url,
      method,
      description,
      collectionId: collection.id,
      folderId: folderId ?? null,
    },
  });

  return request;
});

