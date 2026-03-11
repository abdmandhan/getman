

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

    await prisma.authorization.delete({
        where: {
            id: authorizationId,
        },
    });

    return {
        success: true,
    };
});