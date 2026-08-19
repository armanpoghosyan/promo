export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
    page?: number | null;
}

export interface PaginatedResponse<T> {
    current_page: number;
    data: T[];

    first_page_url?: string;
    from: number | null;
    last_page: number;
    last_page_url?: string;

    links?: PaginationLink[];

    next_page_url?: string | null;
    path?: string;
    per_page: number;
    prev_page_url?: string | null;
    to: number | null;
    total: number;
}

export interface ApiValidationError {
    message?: string;
    errors?: Record<string, string[]>;
}

export type ApiError = {
    response?: {
        status?: number;
        data?: ApiValidationError;
    };
};

export interface ApiMessageResponse {
    message: string;
}

export interface ApiDataResponse<T> {
    data: T;
}

export interface ApiMessageDataResponse<T> {
    message: string;
    data: T;
}
