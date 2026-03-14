

export default defineEventHandler(async (event) => {
    const session = await getUserSession(event);

    if (!session?.user?.username) {
        throw createError({
            statusCode: 401,
            statusMessage: "Unauthorized",
        });
    }

    const environments = await prisma.environment.findMany({
        include: {
            environmentVariables: true,
        }
    });

    return environments;
});