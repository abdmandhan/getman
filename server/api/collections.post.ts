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

  const { name, description } = z
    .object({
      name: z.string().min(1),
      description: z.string().optional(),
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

  const collection = await prisma.collection.create({
    data: {
      name,
      description,
      userCollections: {
        create: {
          userId: user.id,
        },
      },
    },
  });

  return collection;
});

