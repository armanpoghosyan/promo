export type ReceiptStatus =
    | 'submitted'
    | 'reviewing'
    | 'approved'
    | 'rejected'
    | 'winner'
    | 'cancelled';

export interface ReceiptParticipant {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    created_at: string;
    updated_at: string;
    privacy_policy_accepted_at: string | null;
    official_rules_accepted_at: string | null;
    personal_data_consent_at: string | null;
}

export interface ReceiptNote {
    id: number;
    receipt_id: number;
    user_id: number;
    note: string;
    created_at: string;
    updated_at: string;

    user?: {
        id: number;
        name?: string;
    };
}

export interface ReceiptNoteResponse {
    message: string;
    data: ReceiptNote;
}

export interface ReceiptListResponse {
    data: Receipt[];

    current_page: number;
    last_page: number;
    per_page: number;
    total: number;

    from: number | null;
    to: number | null;

    first_page_url?: string;
    last_page_url?: string;
    next_page_url?: string | null;
    prev_page_url?: string | null;
    path?: string;
}

export interface Receipt {
    id: number;
    participant_id: number;
    receipt_number: string;
    receipt_image: string | null;
    image_hash: string | null;
    status: ReceiptStatus;

    is_suspicious: boolean;
    suspicious_reasons: string[];

    submitted_at: string | null;
    verified_at: string | null;
    verified_by: number | null;

    rejection_reason: string | null;
    notes: ReceiptNote[];

    created_at: string;
    updated_at: string;

    participant?: ReceiptParticipant;
}

export interface ReceiptListResponse {
    data: Receipt[];
    meta?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export interface ReceiptResponse {
    data: Receipt;
}
