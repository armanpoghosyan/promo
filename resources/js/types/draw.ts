import type { Prize } from './prize';
import type { Winner } from './winner';

export type DrawStatus =
    | 'draft'
    | 'scheduled'
    | 'running'
    | 'completed';

export interface DrawPrize {
    id: number;

    draw_id: number;
    prize_id: number;

    quantity: number;

    created_at?: string;
    updated_at?: string;

    prize?: Prize;
}

export interface DrawEntry {
    id: number;

    draw_id: number;
    receipt_id: number;

    entry_number: number;

    created_at: string;
    updated_at: string;
}

export interface DrawRandomRequest {
    entries?: number[];
    entry_count?: number;

    [key: string]: unknown;
}

export interface DrawRandomResponse {
    values?: number[];

    [key: string]: unknown;
}

export interface Draw {
    id: number;

    week_number: number;
    draw_date: string;

    status: DrawStatus;

    completed_at: string | null;
    snapshot_at: string | null;

    random_provider: string | null;
    random_request_id: string | null;

    random_request: DrawRandomRequest | null;
    random_response: DrawRandomResponse | null;

    randomized_at: string | null;

    created_by: number | null;

    created_at: string;
    updated_at: string;

    eligible_entries_count?: number;
    required_winners?: number;

    can_prepare?: boolean;
    blocking_reason?: string | null;

    entries_count?: number;

    draw_prizes?: DrawPrize[];
    entries?: DrawEntry[];
    winners?: Winner[];
}

export interface DrawListResponse {
    data: Draw[];
}

export interface DrawResponse {
    data: Draw;
}

export interface CreateDrawResponse {
    message: string;
    data: Draw;
}

export interface DrawSnapshotResult {
    draw: Draw;
    entries_count: number;
    required_winners: number;
}

export interface DrawSnapshotResponse {
    message: string;
    data: DrawSnapshotResult;
}
