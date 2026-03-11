export * from "~~/shared/utils/number";

export function methodColor(method: string) {
    switch (method?.toUpperCase()) {
        case "GET":
            return "green";
        case "POST":
            return "yellow";
        case "PUT":
            return "blue";
        case "PATCH":
            return "indigo";
        case "DELETE":
            return "error";
        default:
            return "default";
    }
}


