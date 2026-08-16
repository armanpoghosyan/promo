export function formatEnumLabel(
    value: string | null | undefined,
    fallback = '-'
): string {
    if (!value) {
        return fallback;
    }

    return value
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (character) =>
            character.toUpperCase()
        );
}
