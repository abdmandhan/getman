import { validateEnvironment } from "~~/shared/types";


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


    const body = await readBody(event);

    const { name, description } = validateEnvironment(body);

    const environment = await prisma.environment.update({
        where: {
            id: environmentId,
        },
        data: {
            name,
            description
        },
    });

    return environment;
});