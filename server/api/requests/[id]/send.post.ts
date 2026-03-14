import { validateSendRequest } from "~~/shared/types";
import {
  buildEnvironmentMap,
  resolveEnvString,
  getUnresolvedEnvKeys,
} from "~~/server/utils/resolve-env";

export default defineEventHandler(async (event) => {
  const start = Date.now();
  const requestId = getRouterParam(event, "id");

  try {

    const findRequest = await prisma.request.findUnique({
      where: {
        id: requestId,
      },
      include: {
        authorization: true,
      },
    });

    if (!findRequest) {
      throw createError({
        statusCode: 404,
        statusMessage: "Request not found",
      });
    }

    const sendBody = await readBody(event);
    const { environmentId } = validateSendRequest(sendBody);

    let envMap: Record<string, string> = {};

    if (environmentId) {
      const environment = await prisma.environment.findUnique({
        where: {
          id: environmentId,
        },
        include: {
          environmentVariables: true,
        },
      });

      if (!environment) {
        throw createError({
          statusCode: 404,
          statusMessage: "Environment not found",
        });
      }

      envMap = buildEnvironmentMap(environment.environmentVariables);
    }

    const rawUrl = findRequest.url;
    const unresolvedUrlKeys = getUnresolvedEnvKeys(rawUrl, envMap);

    if (unresolvedUrlKeys.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: `Unresolved environment variables in URL: ${unresolvedUrlKeys.join(", ")}`,
      });
    }

    const url = resolveEnvString(rawUrl, envMap);

    let headers = (findRequest.headers as Record<string, string>) ?? {};
    const body = findRequest.body as any;

    if (findRequest.authorizationId && findRequest.authorization?.token) {
      const unresolvedTokenKeys = getUnresolvedEnvKeys(
        findRequest.authorization.token,
        envMap
      );

      if (unresolvedTokenKeys.length > 0) {
        throw createError({
          statusCode: 400,
          statusMessage: `Unresolved environment variables in Authorization token: ${unresolvedTokenKeys.join(", ")}`,
        });
      }

      const resolvedToken = resolveEnvString(
        findRequest.authorization.token,
        envMap
      );

      headers = {
        ...headers,
        Authorization: `Bearer ${resolvedToken}`,
      };
    }

    const req = {
      method: findRequest.method,
      headers,
      body,
    };

    const response = await $fetch.raw(url, req);
    const duration = Date.now() - start;

    await prisma.requestLog.create({
      data: {
        requestId: findRequest.id,
        status: String(response.status),
        response: (response._data as object) ?? null,
        error: null,
        duration,
      },
    });

    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: response._data,
    };
  } catch (error: any) {
    const duration = Date.now() - start;
    const statusCode = error?.statusCode ?? 500;
    const statusMessage =
      error?.statusMessage ?? error?.message ?? "Failed to send request";

    if (requestId) {
      await prisma.requestLog.create({
        data: {
          requestId,
          status: String(statusCode),
          error: statusMessage,
          duration,
        },
      }).catch((logErr) => console.error("Failed to create request log", logErr));
    }

    throw createError({
      statusCode: statusCode as number,
      statusMessage,
      data: error?.data,
    });
  }
});