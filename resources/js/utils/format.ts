export function formatEnumLabel(
    value: string | null | undefined,
    fallback = '-'
): string {
    if (!value) {
        return fallback;
    }

    return value
        .replaceAll('_', ' ')
        .replace(
            /\b\w/g,
            (character) =>
                character.toUpperCase()
        );
}

export function formatNumber(
    value: number | null | undefined,
    fallback = '-'
): string {
    if (
        value === null ||
        value === undefined
    ) {
        return fallback;
    }

    return new Intl.NumberFormat()
        .format(value);
}

export function pluralize(
    count: number,
    singular: string,
    plural = `${singular}s`
): string {
    return count === 1
        ? singular
        : plural;
}
