

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

    await prisma.request.delete({
        where: {
            id: requestId,
        },
    });

    return {
        success: true,
    };
});