export const normalize = (item: unknown): { key: string; value: string } | null => {
    if (item && typeof item === "object" && "key" in item && "value" in item) {
        return { key: String((item as { key: unknown }).key), value: String((item as { value: unknown }).value) };
    }
    if (typeof item === "string") {
        try {
            const parsed = JSON.parse(item) as unknown;
            return normalize(parsed);
        } catch {
            return null;
        }
    }
    return null;
};