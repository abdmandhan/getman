import { z } from "zod";
import { normalize } from "../utils/json";

const filterItemSchema = z.object({
    key: z.string(),
    value: z.string(),
});

export const schema = z.object({
    page: z.coerce.number(),
    page_size: z.coerce.number(),
    sort_by: z.string(),
    sort_order: z.string(),
    filters: z.preprocess((value) => {
        if (typeof value === "string") {
            try {
                const parsed = JSON.parse(value) as unknown;
                if (Array.isArray(parsed)) {
                    return parsed.map(normalize).filter((x): x is { key: string; value: string } => x !== null);
                }
                const single = normalize(parsed);
                return single ? [single] : [];
            } catch {
                return [];
            }
        }

        if (Array.isArray(value)) {
            return value.map(normalize).filter((x): x is { key: string; value: string } => x !== null);
        }

        return [];
    }, z.array(filterItemSchema)).default([]),
}).strict();

export type Pagination = z.infer<typeof schema>;

export const validate = (data: unknown): Pagination => {
    return schema.parse(data);
}