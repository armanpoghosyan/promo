export type QueryValue =
    | string
    | number
    | boolean
    | null
    | undefined;

export function buildSearchParams(
    values:
    Record<string, QueryValue>
): URLSearchParams {
    const params =
        new URLSearchParams();

    Object.entries(values)
        .forEach(
            ([key, value]) => {
                if (
                    value === null ||
                    value === undefined ||
                    value === ''
                ) {
                    return;
                }

                params.set(
                    key,
                    String(value)
                );
            }
        );

    return params;
}

export function positiveIntegerParam(
    value: string | null,
    fallback = 1
): number {
    const parsed =
        Number(value);

    if (
        !Number.isInteger(parsed) ||
        parsed < 1
    ) {
        return fallback;
    }

    return parsed;
}
