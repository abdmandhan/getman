import { validateAuthorization } from "~~/shared/types";

export default defineEventHandler(async (event) => {
    const session = await getUserSession(event);

    if (!session?.user?.username) {
        throw createError({
            statusCode: 401,
            statusMessage: "Unauthorized",
        });
    }

    const body = await readBody(event);

    const { name, authType, token, credentials } = validateAuthorization(body);

    const authorization = await prisma.authorization.create({
        data: {
            name,
            authType,
            token,
            credentials,
        },
    });

    return authorization;
});