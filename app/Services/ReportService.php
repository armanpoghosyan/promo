<?php

namespace App\Services;

use App\Enums\DrawWinnerStatus;
use App\Enums\ReceiptStatus;
use App\Models\Draw;
use App\Models\Prize;
use App\Models\Receipt;

class ReportService
{
    public function overview(): array
    {
        return [
            'receipts' => [
                'total' => Receipt::count(),
                'submitted' => Receipt::where('status', ReceiptStatus::SUBMITTED)->count(),
                'approved' => Receipt::where('status', ReceiptStatus::APPROVED)->count(),
                'rejected' => Receipt::where('status', ReceiptStatus::REJECTED)->count(),
                'suspicious' => Receipt::where('is_suspicious', true)->count(),
            ],
        ];
    }

    public function draws(): array
    {
        return Draw::query()
            ->with([
                'drawPrizes.prize',
                'entries',
                'winners',
            ])
            ->orderBy('week_number')
            ->get()
            ->map(function (Draw $draw) {
                $selected = $draw->winners
                    ->where('status', DrawWinnerStatus::SELECTED)
                    ->count();

                $contacting = $draw->winners
                    ->where('status', DrawWinnerStatus::CONTACTING)
                    ->count();

                $confirmed = $draw->winners
                    ->where('status', DrawWinnerStatus::CONFIRMED)
                    ->count();

                $cancelled = $draw->winners
                    ->where('status', DrawWinnerStatus::CANCELLED)
                    ->count();

                return [
                    'id' => $draw->id,
                    'week_number' => $draw->week_number,
                    'draw_date' => $draw->draw_date,
                    'status' => $draw->status->value,
                    'eligible_entries' => $draw->entries->count(),

                    'prizes' => $draw->drawPrizes
                        ->map(fn ($drawPrize) => [
                            'id' => $drawPrize->id,
                            'prize_id' => $drawPrize->prize_id,
                            'name' => $drawPrize->prize?->name,
                            'type' => $drawPrize->prize?->type?->value,
                            'quantity' => $drawPrize->quantity,
                        ])
                        ->values()
                        ->all(),

                    'prize_slots' => $draw->drawPrizes->sum('quantity'),

                    'winners' => [
                        'winner_records' => $draw->winners->count(),
                        'active_winners' => $selected + $contacting + $confirmed,
                        'selected' => $selected,
                        'contacting' => $contacting,
                        'confirmed' => $confirmed,
                        'cancelled' => $cancelled,
                        'replacements' => $draw->winners
                            ->whereNotNull('replaced_winner_id')
                            ->count(),
                    ],

                    'random' => [
                        'provider' => $draw->random_provider,
                        'request_id' => $draw->random_request_id,
                        'randomized_at' => $draw->randomized_at,
                    ],
                ];
            })
            ->values()
            ->all();
    }

    public function prizeAllocation(): array
    {
        return Prize::query()
            ->with('drawPrizes')
            ->get()
            ->map(function (Prize $prize) {
                $allocated = $prize->drawPrizes->sum('quantity');

                return [
                    'prize_id' => $prize->id,
                    'name' => $prize->name,
                    'type' => $prize->type->value,
                    'total_quantity' => $prize->total_quantity,
                    'allocated_quantity' => $allocated,
                    'remaining_quantity' => max(
                        0,
                        $prize->total_quantity - $allocated
                    ),
                    'within_limit' => $allocated <= $prize->total_quantity,
                ];
            })
            ->values()
            ->all();
    }
}
