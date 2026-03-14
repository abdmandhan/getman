export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);

  if (!session?.user?.username) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const environmentId = getRouterParam(event, "id");

  if (!environmentId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Environment ID is required",
    });
  }

  const variables = await prisma.environmentVariable.findMany({
    where: { environmentId },
    orderBy: { key: "asc" },
  });

  return variables;
});
