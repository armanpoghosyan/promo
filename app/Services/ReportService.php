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

                'submitted' => Receipt::where(
                    'status',
                    ReceiptStatus::SUBMITTED
                )->count(),

                'approved' => Receipt::where(
                    'status',
                    ReceiptStatus::APPROVED
                )->count(),

                'rejected' => Receipt::where(
                    'status',
                    ReceiptStatus::REJECTED
                )->count(),
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
                return [
                    'id' => $draw->id,
                    'week_number' => $draw->week_number,
                    'draw_date' => $draw->draw_date,
                    'status' => $draw->status?->value ?? $draw->status,

                    'eligible_entries' => $draw->entries->count(),

                    'prizes' => $draw->drawPrizes
                        ->map(function ($drawPrize) {
                            return [
                                'id' => $drawPrize->id,
                                'prize_id' => $drawPrize->prize_id,
                                'name' => $drawPrize->prize?->name,
                                'type' => $drawPrize->prize?->type?->value
                                    ?? $drawPrize->prize?->type,
                                'quantity' => $drawPrize->quantity,
                            ];
                        })
                        ->values()
                        ->all(),

                    'total_prizes' => $draw->drawPrizes->sum('quantity'),

                    'winners' => [
                        'total' => $draw->winners->count(),

                        'selected' => $draw->winners
                            ->where('status', DrawWinnerStatus::SELECTED)
                            ->count(),

                        'contacting' => $draw->winners
                            ->where('status', DrawWinnerStatus::CONTACTING)
                            ->count(),

                        'confirmed' => $draw->winners
                            ->where('status', DrawWinnerStatus::CONFIRMED)
                            ->count(),

                        'cancelled' => $draw->winners
                            ->where('status', DrawWinnerStatus::CANCELLED)
                            ->count(),
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
                    'type' => $prize->type?->value ?? $prize->type,
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
