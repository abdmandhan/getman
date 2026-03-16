import { z } from "zod";
import { prisma } from "~~/server/utils/db";
import { requireCurrentUser } from "~~/server/utils/sidebar";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const { name, description } = z
    .object({
      name: z.string().min(1),
      description: z.string().optional(),
    })
    .parse(body);

  const user = await requireCurrentUser(event);

  const collectionCount = await prisma.collection.count({
    where: {
      userCollections: {
        some: {
          userId: user.id,
        },
      },
    },
  });

  const collection = await prisma.collection.create({
    data: {
      index: collectionCount,
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
