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
    draw_date: string | null;
    status: string;
    entries: number;
    prizes: number;
}

export interface DashboardPrize {
    id: number;
    name: string;
    type: string;
    total: number;
    allocated: number;
    remaining: number;
}

export interface DashboardReceipt {
    id: number;
    participant_id: number;
    receipt_number: string;
    status: string;
    created_at: string;
}

export interface DashboardWinner {
    id: number;
    draw_id: number;
    week_number: number | null;
    prize: string | null;
    receipt_id: number;
    entry_number: number;
    status: string;
    selected_at: string;
}

export interface DashboardData {
    kpis: DashboardKpis;

    current_draw: DashboardDraw | null;

    recent_receipts: DashboardReceipt[];

    recent_winners: DashboardWinner[];

    prizes: DashboardPrize[];
}

export interface DashboardResponse {
    data: DashboardData;
}
