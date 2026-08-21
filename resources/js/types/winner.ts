import type { Draw, DrawPrize } from './draw';
import type { Participant } from './participant';
import type { Receipt } from './receipt';
import type { Prize } from './prize';

export type WinnerStatus =
    | 'selected'
    | 'contacting'
    | 'confirmed'
    | 'cancelled';

export type ContactAttemptResult =
    | 'no_answer'
    | 'busy'
    | 'wrong_number'
    | 'contacted'
    | 'other';

export interface WinnerContactAttempt {
    id: number;
    draw_winner_id: number;
    created_by: number | null;
    attempted_at: string;
    result: ContactAttemptResult;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface Winner {
    id: number;
    draw_id: number;
    draw_prize_id: number;
    receipt_id: number;
    entry_number: number;
    status: WinnerStatus;

    selected_at: string;
    confirmed_at: string | null;
    cancelled_at: string | null;
    cancellation_reason: string | null;
    replaced_winner_id: number | null;

    created_at: string;
    updated_at: string;

    draw?: Draw;
    draw_prize?: DrawPrize;
    receipt?: Receipt;
    contact_attempts?: WinnerContactAttempt[];

    replaced_winner?: Winner | null;
    replacement_winner?: Winner | null;
}

export interface WinnerDetail
    extends Omit<
        Winner,
        | 'draw'
        | 'draw_prize'
        | 'receipt'
        | 'contact_attempts'
        | 'replaced_winner'
        | 'replacement_winner'
    > {
    draw: Draw;

    draw_prize: DrawPrize & {
        prize: Prize;
    };

    receipt: Receipt & {
        participant: Participant;
    };

    contact_attempts: WinnerContactAttempt[];

    replaced_winner: Winner | null;
    replacement_winner: Winner | null;
}

export interface WinnerResponse {
    data: WinnerDetail;
}

export interface WinnerActionResponse {
    message: string;
    data: WinnerDetail;
}

export interface ContactAttemptResponse {
    message: string;
    data: WinnerContactAttempt;
}
