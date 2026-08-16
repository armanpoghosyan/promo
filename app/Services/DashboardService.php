<?php

namespace App\Services;

use App\Enums\DrawStatus;
use App\Enums\DrawWinnerStatus;
use App\Enums\ReceiptStatus;
use App\Models\Draw;
use App\Models\DrawEntry;
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

                /*
                 * Entries in the current running draw.
                 *
                 * Historical draw entries should not be presented
                 * as "active entries".
                 */
                'active_entries' => $this->activeEntriesCount(),

                'total_winners' => DrawWinner::count(),

                'awaiting_winners' => DrawWinner::whereIn(
                    'status',
                    [
                        DrawWinnerStatus::SELECTED,
                        DrawWinnerStatus::CONTACTING,
                    ]
                )->count(),

                'confirmed_winners' => DrawWinner::where(
                    'status',
                    DrawWinnerStatus::CONFIRMED
                )->count(),

                'cancelled_winners' => DrawWinner::where(
                    'status',
                    DrawWinnerStatus::CANCELLED
                )->count(),
            ],

            'current_draw' => $this->currentDraw(),

            'recent_receipts' => $this->recentReceipts(),

            'recent_winners' => $this->recentWinners(),

            'prizes' => $this->prizes(),
        ];
    }

    private function activeEntriesCount(): int
    {
        $runningDraw = Draw::query()
            ->where(
                'status',
                DrawStatus::RUNNING
            )
            ->orderByDesc('started_at')
            ->first();

        if (!$runningDraw) {
            return 0;
        }

        return DrawEntry::query()
            ->where(
                'draw_id',
                $runningDraw->id
            )
            ->count();
    }

    private function currentDraw(): ?array
    {
        /*
         * A running draw is more important than
         * a future scheduled/draft draw.
         */
        $draw = Draw::query()
            ->where(
                'status',
                DrawStatus::RUNNING
            )
            ->orderByDesc('started_at')
            ->first();

        /*
         * If nothing is currently running,
         * find the next future draw.
         */
        if (!$draw) {
            $draw = Draw::query()
                ->whereIn(
                    'status',
                    [
                        DrawStatus::DRAFT,
                        DrawStatus::SCHEDULED,
                    ]
                )
                ->whereNotNull('draw_date')
                ->where(
                    'draw_date',
                    '>=',
                    now()
                )
                ->orderBy('draw_date')
                ->first();
        }

        if (!$draw) {
            return null;
        }

        return [
            'id' => $draw->id,
            'week_number' => $draw->week_number,
            'draw_date' => $draw->draw_date,
            'status' => $draw->status?->value
                ?? $draw->status,
            'entries' => $draw->entries()->count(),
            'prizes' => $draw->drawPrizes()->sum(
                'quantity'
            ),
        ];
    }

    private function recentReceipts(): array
    {
        return Receipt::query()
            ->latest()
            ->limit(6)
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
            ])
            ->latest('selected_at')
            ->limit(6)
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
                $allocated = $prize
                    ->drawPrizes
                    ->sum('quantity');

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
