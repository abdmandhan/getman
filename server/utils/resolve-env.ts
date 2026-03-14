export const ENV_REGEX = /{{\s*([\w.-]+)\s*}}/g

export function buildEnvironmentMap(
    variables: Array<{ key: string; value: string | null | undefined }>
) {
    const map: Record<string, string> = {}

    for (const item of variables) {
        if (!item?.key) continue
        map[item.key] = item.value ?? ''
    }

    return map
}

export function resolveEnvString(
    input: string,
    envMap: Record<string, string>
) {
    if (!input) return input

    return input.replace(ENV_REGEX, (_, key: string) => {
        const value = envMap[key]
        return value !== undefined ? value : `{{${key}}}`
    })
}

export function getUnresolvedEnvKeys(
    input: string,
    envMap: Record<string, string>
) {
    const matches = [...input.matchAll(ENV_REGEX)]
        .map((match) => match[1])
        .filter((key): key is string => key !== undefined)
    const uniqueKeys = [...new Set(matches)]

    return uniqueKeys.filter((key) => !(key in envMap))
}