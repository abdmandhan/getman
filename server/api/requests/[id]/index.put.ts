import { validateRequestUpdate } from "~~/shared/types";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);

  if (!session?.user?.username) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const requestId = getRouterParam(event, "id");

  if (!requestId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Request ID is required",
    });
  }

  const body = await readBody(event);
  const data = validateRequestUpdate(body);

  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.url !== undefined) payload.url = data.url;
  if (data.method !== undefined) payload.method = data.method;
  if (data.body_type !== undefined) payload.body_type = data.body_type;
  if (data.body !== undefined) payload.body = data.body;
  if (data.description !== undefined) payload.description = data.description;
  if (data.authorizationId !== undefined) payload.authorizationId = data.authorizationId;
  if (data.headers !== undefined) payload.headers = data.headers;

  const request = await prisma.request.update({
    where: { id: requestId },
    data: payload,
  });

  return request;
});
