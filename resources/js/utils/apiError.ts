import type {
    ApiError,
} from '../types/api';

export function getApiErrorMessage(
    error: unknown,
    fallback: string
): string {
    const apiError =
        error as ApiError;

    return (
        apiError.response?.data?.message ??
        fallback
    );
}

export function getFirstValidationError(
    error: unknown
): string | null {
    const apiError =
        error as ApiError;

    const errors =
        apiError.response?.data?.errors;

    if (!errors) {
        return null;
    }

    for (
        const messages
        of Object.values(errors)
        ) {
        const firstMessage =
            messages?.[0];

        if (firstMessage) {
            return firstMessage;
        }
    }

    return null;
}

export function getApiErrorMessageOrValidation(
    error: unknown,
    fallback: string
): string {
    return (
        getFirstValidationError(error) ??
        getApiErrorMessage(
            error,
            fallback
        )
    );
}

export function getValidationErrors(
    error: unknown
): Record<string, string[]> {
    const apiError =
        error as ApiError;

    return (
        apiError.response
            ?.data
            ?.errors ??
        {}
    );
}

export function isApiStatus(
    error: unknown,
    status: number
): boolean {
    const apiError =
        error as ApiError;

    return (
        apiError.response?.status ===
        status
    );
}
