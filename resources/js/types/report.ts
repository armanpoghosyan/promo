import type { PrizeAllocation, PrizeType } from './prize';
import type { DrawStatus } from './draw';

export interface ReportReceiptOverview {
    total: number;
    submitted: number;
    approved: number;
    rejected: number;
    suspicious: number;
}

export interface ReportDrawPrize {
    id: number;

    prize_id: number;

    name: string | null;
    type: PrizeType | null;

    quantity: number;
}

export interface ReportWinnerCounters {
    winner_records: number;
    active_winners: number;

    selected: number;
    contacting: number;
    confirmed: number;
    cancelled: number;

    replacements: number;
}

export interface ReportRandomInfo {
    provider: string | null;
    request_id: string | null;
    randomized_at: string | null;
}

export interface ReportDraw {
    id: number;

    week_number: number;
    draw_date: string;

    status: DrawStatus;

    eligible_entries: number;

    prizes: ReportDrawPrize[];

    prize_slots: number;

    winners: ReportWinnerCounters;

    random: ReportRandomInfo;
}

export interface ReportOverviewData {
    overview: {
        receipts: ReportReceiptOverview;
    };

    draws: ReportDraw[];

    prize_allocation: PrizeAllocation[];
}

export interface ReportsResponse {
    data: ReportOverviewData;
}
