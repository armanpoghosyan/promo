import type { Receipt } from './receipt';

export interface Participant {
    id: number;

    first_name: string;
    last_name: string;

    phone: string;
    email: string;

    created_at: string;
    updated_at: string;

    receipts_count?: number;

    receipts?: Receipt[];
}

export interface ParticipantResponse {
    data: Participant;
}
