export interface DashboardKpis {
    total_receipts: number;
    pending_receipts: number;
    approved_receipts: number;
    active_entries: number;
    total_winners: number;
    confirmed_winners: number;
    cancelled_winners: number;
}

export interface DashboardPrize {
    id: number;
    name: string;
    type: string;
    total: number;
    allocated: number;
    remaining: number;
}

export interface DashboardData {
    kpis: DashboardKpis;
    upcoming_draw: {
        id: number;
        week_number: number;
        draw_date: string;
        status: string;
        entries: number;
        prizes: number;
    } | null;
    recent_receipts: unknown[];
    recent_winners: unknown[];
    prizes: DashboardPrize[];
}

export interface DashboardResponse {
    data: DashboardData;
}
