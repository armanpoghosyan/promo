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

export interface ReceiptResponse {
    data: Receipt;
}
