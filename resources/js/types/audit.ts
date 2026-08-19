import type { AdminUser } from './auth';

export type AuditValue =
    | string
    | number
    | boolean
    | null
    | AuditValue[]
    | {
    [key: string]: AuditValue;
};

export type AuditValues =
    Record<string, AuditValue>;

export interface AuditLog {
    id: number;

    user_id: number | null;

    action: string;

    auditable_type: string | null;
    auditable_id: number | null;

    old_values: AuditValues | null;
    new_values: AuditValues | null;

    description: string | null;

    ip_address: string | null;
    user_agent: string | null;

    created_at: string;
    updated_at: string;

    user?: AdminUser | null;
}

export interface AuditLogFilters {
    action?: string;
    user_id?: number;
    auditable_type?: string;
    auditable_id?: number;

    date_from?: string;
    date_to?: string;

    page?: number;
    per_page?: number;
}
