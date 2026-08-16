export function formatDateTime(
    value: string | null | undefined,
    fallback = '-'
): string {
    if (!value) {
        return fallback;
    }

    return new Date(value).toLocaleString();
}

export function formatDate(
    value: string | null | undefined,
    fallback = '-'
): string {
    if (!value) {
        return fallback;
    }

    return new Date(value).toLocaleDateString();
}

export function toDateTimeLocal(
    value: string | null | undefined
): string {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(
        date.getTime() - offset * 60 * 1000
    );

    return localDate.toISOString().slice(0, 16);
}
