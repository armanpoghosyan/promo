<?php

namespace App\Services;

use App\Enums\DrawStatus;
use App\Enums\DrawWinnerStatus;
use App\Enums\ReceiptStatus;
use App\Models\Draw;
use App\Models\DrawWinner;
use App\Models\Prize;
use App\Models\Receipt;

class DashboardService
{
    public function overview(): array
    {
        return [
            'kpis' => [
                'total_receipts' => Receipt::count(),

                'pending_receipts' => Receipt::whereIn(
                    'status',
                    [
                        ReceiptStatus::SUBMITTED,
                        ReceiptStatus::REVIEWING,
                    ]
                )->count(),

                'approved_receipts' => Receipt::where(
                    'status',
                    ReceiptStatus::APPROVED
                )->count(),

                'active_entries' => \App\Models\DrawEntry::count(),

                'total_winners' => DrawWinner::count(),

                'confirmed_winners' => DrawWinner::where(
                    'status',
                    DrawWinnerStatus::CONFIRMED
                )->count(),

                'cancelled_winners' => DrawWinner::where(
                    'status',
                    DrawWinnerStatus::CANCELLED
                )->count(),
            ],

            'upcoming_draw' => $this->upcomingDraw(),

            'recent_receipts' => $this->recentReceipts(),

            'recent_winners' => $this->recentWinners(),

            'prizes' => $this->prizes(),
        ];
    }

    private function upcomingDraw(): ?array
    {
        $draw = Draw::query()
            ->where('draw_date', '>=', now())
            ->orderBy('draw_date')
            ->first();

        if (!$draw) {
            return null;
        }

        return [
            'id' => $draw->id,
            'week_number' => $draw->week_number,
            'draw_date' => $draw->draw_date,
            'status' => $draw->status?->value ?? $draw->status,
            'entries' => $draw->entries()->count(),
            'prizes' => $draw->drawPrizes()->sum('quantity'),
        ];
    }

    private function recentReceipts(): array
    {
        return Receipt::query()
            ->with('participant')
            ->latest()
            ->limit(10)
            ->get()
            ->map(function (Receipt $receipt) {
                return [
                    'id' => $receipt->id,
                    'participant_id' => $receipt->participant_id,
                    'receipt_number' => $receipt->receipt_number,
                    'status' => $receipt->status?->value
                        ?? $receipt->status,
                    'created_at' => $receipt->created_at,
                ];
            })
            ->values()
            ->all();
    }

    private function recentWinners(): array
    {
        return DrawWinner::query()
            ->with([
                'draw',
                'drawPrize.prize',
                'receipt',
            ])
            ->latest('selected_at')
            ->limit(10)
            ->get()
            ->map(function (DrawWinner $winner) {
                return [
                    'id' => $winner->id,
                    'draw_id' => $winner->draw_id,
                    'week_number' => $winner->draw?->week_number,
                    'prize' => $winner->drawPrize?->prize?->name,
                    'receipt_id' => $winner->receipt_id,
                    'entry_number' => $winner->entry_number,
                    'status' => $winner->status?->value
                        ?? $winner->status,
                    'selected_at' => $winner->selected_at,
                ];
            })
            ->values()
            ->all();
    }

    private function prizes(): array
    {
        return Prize::query()
            ->with('drawPrizes')
            ->get()
            ->map(function (Prize $prize) {
                $allocated = $prize->drawPrizes->sum('quantity');

                return [
                    'id' => $prize->id,
                    'name' => $prize->name,
                    'type' => $prize->type?->value
                        ?? $prize->type,
                    'total' => $prize->total_quantity,
                    'allocated' => $allocated,
                    'remaining' => max(
                        0,
                        $prize->total_quantity - $allocated
                    ),
                ];
            })
            ->values()
            ->all();
    }
}
