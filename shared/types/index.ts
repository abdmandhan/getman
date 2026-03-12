import { z } from "zod";
import { AuthType, BodyType } from "~~/prisma/generated/client";



export const AuthorizationSchema = z.object({
    name: z.string().min(1),
    authType: z.enum(Object.values(AuthType)),
    token: z.string().optional(),
    credentials: z.any().optional(),
});



export const validateAuthorization = (data: unknown): z.infer<typeof AuthorizationSchema> => {
    return AuthorizationSchema.parse(data);
};

export const RequestSchema = z.object({
    name: z.string().min(1),
    url: z.string().min(1),
    method: z.string().min(1),
    body_type: z.enum(Object.values(BodyType)),
    body: z.any().nullable(),
    collectionId: z.string().min(1),
    folderId: z.string().optional().nullable(),
    description: z.string().optional(),
    authorizationId: z.string().optional().nullable(),
});

export const validateRequest = (data: unknown): z.infer<typeof RequestSchema> => {
    return RequestSchema.parse(data);
};
