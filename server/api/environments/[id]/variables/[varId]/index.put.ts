import { validateEnvironmentVariable } from "~~/shared/types";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);

  if (!session?.user?.username) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const environmentId = getRouterParam(event, "id");
  const varId = getRouterParam(event, "varId");

  if (!environmentId || !varId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Environment ID and variable ID are required",
    });
  }

  const existing = await prisma.environmentVariable.findFirst({
    where: { id: varId, environmentId },
  });

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: "Variable not found in this environment",
    });
  }

  const body = await readBody(event);

  const { key, value } = validateEnvironmentVariable(body);

  const variable = await prisma.environmentVariable.update({
    where: { id: varId },
    data: { key, value },
  });

  return variable;
});
