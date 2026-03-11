import { z } from "zod";
import { AuthType } from "~~/prisma/generated/client";



export const AuthorizationSchema = z.object({
    name: z.string().min(1),
    authType: z.enum(Object.values(AuthType)),
    token: z.string().optional(),
    credentials: z.any().optional(),
});



export const validateAuthorization = (data: unknown): z.infer<typeof AuthorizationSchema> => {
    return AuthorizationSchema.parse(data);
};