import type {
    AdminUser,
} from './auth';

import type {
    Participant,
} from './participant';

export type ReceiptStatus =
    | 'submitted'
    | 'approved'
    | 'rejected';

export type SuspiciousReason =
    | 'duplicate_receipt_number'
    | 'duplicate_receipt_image'
    | 'phone_used_by_another_participant'
    | 'email_used_by_another_participant'
    | 'receipt_number_non_numeric'
    | string;

export interface ReceiptNoteUser {
    id: number;
    name: string;

    email?: string | null;
}

export interface ReceiptNote {
    id: number;

    receipt_id: number;
    user_id: number | null;

    note: string;

    created_at: string;
    updated_at: string;

    user?:
        | ReceiptNoteUser
        | null;
}

export interface Receipt {
    id: number;

    participant_id: number;

    receipt_number: string;
    receipt_image: string;
    image_hash:
        | string
        | null;

    status: ReceiptStatus;

    is_suspicious: boolean;

    suspicious_reasons:
        | SuspiciousReason[]
        | null;

    submitted_at:
        | string
        | null;

    privacy_policy_accepted_at:
        | string
        | null;

    official_rules_accepted_at:
        | string
        | null;

    personal_data_consent_at:
        | string
        | null;

    verified_at:
        | string
        | null;

    verified_by:
        | number
        | null;

    rejection_reason:
        | string
        | null;

    created_at: string;
    updated_at: string;

    participant?:
        | Participant
        | null;

    notes?: ReceiptNote[];

    notes_count?: number;

    latest_note?:
        | ReceiptNote
        | null;

    verified_by_user?:
        | AdminUser
        | null;
}

export interface ReceiptResponse {
    data: Receipt;
}

export interface ReceiptNoteResponse {
    message: string;
    data: ReceiptNote;
}

export interface ReceiptListCounts {
    all: number;
    submitted: number;
    approved: number;
    rejected: number;
    suspicious: number;
}

export interface ReceiptListMeta {
    counts: ReceiptListCounts;

    filters: {
        search:
            | string
            | null;

        status:
            | ReceiptStatus
            | null;

        suspicious: boolean;

        suspicious_reason:
            | string
            | null;

        date_from:
            | string
            | null;

        date_to:
            | string
            | null;

        direction:
            | 'asc'
            | 'desc';
    };
}

export interface ReceiptListResponse {
    data: Receipt[];

    current_page: number;
    last_page: number;
    per_page: number;
    total: number;

    from:
        | number
        | null;

    to:
        | number
        | null;

    meta: ReceiptListMeta;
}
