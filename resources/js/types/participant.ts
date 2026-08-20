import type {
    Receipt,
} from './receipt';

export interface Participant {
    id: number;

    first_name: string;
    last_name: string;

    phone: string;
    email: string;

    privacy_policy_accepted_at?:
        | string
        | null;

    official_rules_accepted_at?:
        | string
        | null;

    personal_data_consent_at?:
        | string
        | null;

    created_at: string;
    updated_at: string;

    receipts_count?: number;

    receipts?: Receipt[];
}

export interface ParticipantResponse {
    data: Participant;
}
