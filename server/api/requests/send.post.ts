import { z } from "zod";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const { url, method, headers, payload } = z
    .object({
      url: z.string().url(),
      method: z.string().min(1),
      headers: z.record(z.string()).optional(),
      payload: z.any().optional(),
    })
    .parse(body);

  try {
    const response = await $fetch.raw(url, {
      method,
      headers,
      body: payload,
    });

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

