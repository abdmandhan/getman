import { prisma } from "~~/server/utils/db";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);

  if (!session?.user?.username) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

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

  const collections = await prisma.collection.findMany({
    where: {
      userCollections: {
        some: {
          userId: user.id,
        },
      },
    },
    include: {
      folders: {
        include: {
          requests: true,
        },
      },
      requests: {
        where: {
          folderId: null,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return collections;
});

