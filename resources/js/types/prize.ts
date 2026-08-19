export type PrizeType =
    | 'burn'
    | 'new_balance_certificate'
    | 'scooter';

export interface Prize {
    id: number;

    name: string;
    type: PrizeType;

    total_quantity: number;

    created_at?: string;
    updated_at?: string;
}

export interface AvailablePrize extends Prize {
    allocated_quantity: number;
    available_quantity: number;
}

export interface PrizeAllocation {
    prize_id: number;

    name: string;
    type: PrizeType;

    total_quantity: number;
    allocated_quantity: number;
    remaining_quantity: number;

    within_limit: boolean;
}
