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

  const { name, collectionId } = z
    .object({
      name: z.string().min(1),
      collectionId: z.string().min(1),
    })
    .parse(body);

  const user = await prisma.user.findFirst({
    where: {
      email: session.user.username,
    },
  });

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "User not found",
    });
  }

  // Ensure the collection belongs to this user
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

  const folder = await prisma.folder.create({
    data: {
      name,
      userId: user.id,
      collectionId: collection.id,
    },
  });

  return folder;
});

