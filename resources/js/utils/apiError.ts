import type { ApiError } from '../types/api';

export function getApiErrorMessage(
    error: unknown,
    fallback: string
): string {
    const apiError = error as ApiError;

    return apiError.response?.data?.message ?? fallback;
}
