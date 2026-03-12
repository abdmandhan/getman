import { z } from "zod";

export default defineEventHandler(async (event) => {
  try {
    const requestId = getRouterParam(event, "id");

    const findRequest = await prisma.request.findUnique({
      where: {
        id: requestId,
      },
      include: {
        authorization: true
      }
    });

    if (!findRequest) {
      throw createError({
        statusCode: 404,
        statusMessage: "Request not found",
      });
    }

    let headers = findRequest.headers as Record<string, string>;
    let body = findRequest.body as any;
    let url = findRequest.url;

    if (findRequest.authorizationId) {
      headers = {
        ...headers,
        Authorization: `Bearer ${findRequest.authorization?.token}`,
      };
    }

    const req = {
      method: findRequest.method,
      headers,
      body,
    }
    console.log('request', req)

    const response = await $fetch.raw(url, req);

    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: await response._data,
    };
  } catch (error: any) {
    console.error("Error sending request", error);
    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage:
        error?.statusMessage || error?.message || "Failed to send request",
      data: error?.data,
    });
  }
});

