import { validateEnvironment } from "~~/shared/types";

export default defineEventHandler(async (event) => {
    const session = await getUserSession(event);

    if (!session?.user?.username) {
        throw createError({
            statusCode: 401,
            statusMessage: "Unauthorized",
        });
    }

    const body = await readBody(event);

    const { name, description } = validateEnvironment(body);

    const environment = await prisma.environment.create({
        data: {
            name,
            description,
        },
    });

    return environment;
});