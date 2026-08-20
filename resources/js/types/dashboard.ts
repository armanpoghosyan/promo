import type {
    DrawStatus,
} from './draw';

import type {
    PrizeType,
} from './prize';

export interface DashboardKpis {
    total_receipts: number;
    pending_receipts: number;
    approved_receipts: number;
    active_entries: number;

    total_winners: number;
    awaiting_winners: number;
    confirmed_winners: number;
    cancelled_winners: number;
}

export interface DashboardDraw {
    id: number;

    week_number: number;
    draw_date: string;

    status: DrawStatus;

    entries: number;
    prizes: number;
}

export interface DashboardPrize {
    id: number;

    name: string;
    type: PrizeType;

    total: number;
    allocated: number;
    remaining: number;
}

export interface DashboardActivity {
    id: number;

    action: string;

    title: string;
    description: string | null;

    occurred_at: string;

    resource_id: number | null;

    meta: Record<
        string,
        string | number | boolean | null
    >;
}

export interface DashboardData {
    kpis: DashboardKpis;

    current_draw:
        DashboardDraw | null;

    receipt_activity:
        DashboardActivity[];

    winner_activity:
        DashboardActivity[];

    prizes:
        DashboardPrize[];
}

export interface DashboardResponse {
    data: DashboardData;
}
