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


export const EnvironmentSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
});

export const validateEnvironment = (data: unknown): z.infer<typeof EnvironmentSchema> => {
    return EnvironmentSchema.parse(data);
};

export const EnvironmentVariableSchema = z.object({
    key: z.string().min(1),
    value: z.string(),
});

export const validateEnvironmentVariable = (data: unknown): z.infer<typeof EnvironmentVariableSchema> => {
    return EnvironmentVariableSchema.parse(data);
};

export const SendRequestSchema = z.object({
    environmentId: z.string().optional().nullable(),
});

export const validateSendRequest = (data: unknown): z.infer<typeof SendRequestSchema> => {
    return SendRequestSchema.parse(data);
};