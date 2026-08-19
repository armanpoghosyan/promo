function parseDate(
    value: string | null | undefined
): Date | null {
    if (!value) {
        return null;
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return null;
    }

    return date;
}

export function formatDateTime(
    value: string | null | undefined,
    fallback = '-'
): string {
    const date =
        parseDate(value);

    if (!date) {
        return fallback;
    }

    return date.toLocaleString();
}

export function formatDate(
    value: string | null | undefined,
    fallback = '-'
): string {
    const date =
        parseDate(value);

    if (!date) {
        return fallback;
    }

    return date.toLocaleDateString();
}

export function formatTime(
    value: string | null | undefined,
    fallback = '-'
): string {
    const date =
        parseDate(value);

    if (!date) {
        return fallback;
    }

    return date.toLocaleTimeString();
}

export function toDateTimeLocal(
    value: string | null | undefined
): string {
    const date =
        parseDate(value);

    if (!date) {
        return '';
    }

    const offset =
        date.getTimezoneOffset();

    const localDate =
        new Date(
            date.getTime() -
            offset * 60 * 1000
        );

    return localDate
        .toISOString()
        .slice(0, 16);
}
