import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../prisma/generated/client";

const prismaClientSingleton = () => {
    const pool = new PrismaPg({ connectionString: process.env.URS_DATABASE_URL! });
    return new PrismaClient({ adapter: pool }).$extends({
        query: {
            $allOperations: async ({ args, query }) => {
                const result = await query(args);
                // Use JSON.parse(JSON.stringify(...)) with a custom replacer to handle BigInts
                return JSON.parse(
                    JSON.stringify(result, (key, value) => {
                        return typeof value === 'bigint' ? value.toString() : value;
                    })
                );
            }
        }
    });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;