

export default defineEventHandler(async (event) => {
    const session = await getUserSession(event);

    if (!session?.user?.username) {
        throw createError({
            statusCode: 401,
            statusMessage: "Unauthorized",
        });
    }


    const authorizationId = getRouterParam(event, "id");

    if (!authorizationId) {
        throw createError({
            statusCode: 400,
            statusMessage: "Authorization ID is required",
        });
    }


    const body = await readBody(event);

    const { name, authType, token, credentials } = validateAuthorization(body);

    const authorization = await prisma.authorization.update({
        where: {
            id: authorizationId,
        },
        data: {
            name,
            authType,
            token,
            credentials,
        },
    });

    return authorization;
});