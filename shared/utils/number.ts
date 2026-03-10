export const formatCurrency = (amount: number, digits: number = 2) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        notation: 'compact',
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    }).format(amount);
};


export const formatThousand = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

export const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

export const toNum = (v: unknown): number => {
    if (v == null) return 0;
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    if (typeof v === "object" && v !== null && "toNumber" in v && typeof (v as { toNumber(): number }).toNumber === "function") {
        return (v as { toNumber(): number }).toNumber();
    }
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
}