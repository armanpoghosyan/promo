<?php

namespace App\Services;

use App\Enums\DrawStatus;
use App\Enums\DrawWinnerStatus;
use App\Enums\ReceiptStatus;
use App\Models\AuditLog;
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

                'pending_receipts' => Receipt::where(
                    'status',
                    ReceiptStatus::SUBMITTED
                )->count(),

                'approved_receipts' => Receipt::where(
                    'status',
                    ReceiptStatus::APPROVED
                )->count(),

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

            'receipt_activity' => $this->receiptActivity(),

            'winner_activity' => $this->winnerActivity(),

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
            ->orderByDesc('snapshot_at')
            ->first();

        if (! $runningDraw) {
            return 0;
        }

        return DrawEntry::where(
            'draw_id',
            $runningDraw->id
        )->count();
    }

    private function currentDraw(): ?array
    {
        $draw = Draw::query()
            ->where(
                'status',
                DrawStatus::RUNNING
            )
            ->orderByDesc('snapshot_at')
            ->first();

        if (! $draw) {
            $draw = Draw::query()
                ->whereIn(
                    'status',
                    [
                        DrawStatus::DRAFT,
                        DrawStatus::SCHEDULED,
                    ]
                )
                ->where(
                    'draw_date',
                    '>=',
                    now()
                )
                ->orderBy('draw_date')
                ->first();
        }

        if (! $draw) {
            return null;
        }

        return [
            'id' => $draw->id,

            'week_number' => $draw->week_number,

            'draw_date' => $draw->draw_date,

            'status' => $draw->status->value,

            'entries' => $draw->entries()->count(),

            'prizes' => $draw->drawPrizes()
                ->sum('quantity'),
        ];
    }

    private function receiptActivity(): array
    {
        $actions = [
            'receipt.submitted',
            'receipt.approved',
            'receipt.rejected',
            'receipt.note_added',
        ];

        return AuditLog::query()
            ->where(
                'auditable_type',
                Receipt::class
            )
            ->whereIn(
                'action',
                $actions
            )
            ->latest()
            ->limit(8)
            ->get()
            ->map(function (
                AuditLog $log
            ) {
                $receipt = Receipt::query()
                    ->select([
                        'id',
                        'receipt_number',
                    ])
                    ->find(
                        $log->auditable_id
                    );

                $title = match (
                    $log->action
                ) {
                    'receipt.submitted' => 'Receipt submitted',

                    'receipt.approved' => 'Receipt approved',

                    'receipt.rejected' => 'Receipt rejected',

                    'receipt.note_added' => 'Receipt note added',

                    default => 'Receipt activity',
                };

                return [
                    'id' => $log->id,

                    'action' => $log->action,

                    'title' => $title,

                    'description' => $receipt
                            ? 'Receipt #'.$receipt->receipt_number
                            : 'Receipt #'.$log->auditable_id,

                    'occurred_at' => $log->created_at,

                    'resource_id' => $log->auditable_id,

                    'meta' => [],
                ];
            })
            ->values()
            ->all();
    }

    private function winnerActivity(): array
    {
        $actions = [
            'winner.confirmed',
            'winner.contact_attempt_added',
            'winner.cancelled',
            'winner.replacement_selected',
        ];

        return AuditLog::query()
            ->where(
                'auditable_type',
                DrawWinner::class
            )
            ->whereIn(
                'action',
                $actions
            )
            ->latest()
            ->limit(8)
            ->get()
            ->map(function (
                AuditLog $log
            ) {
                $winner = DrawWinner::query()
                    ->with([
                        'draw',
                        'drawPrize.prize',
                    ])
                    ->find(
                        $log->auditable_id
                    );

                $title = match (
                    $log->action
                ) {
                    'winner.confirmed' => 'Winner confirmed',

                    'winner.contact_attempt_added' => 'Contact attempt',

                    'winner.cancelled' => 'Winner cancelled',

                    'winner.replacement_selected' => 'Replacement winner selected',

                    default => 'Winner activity',
                };

                $descriptionParts = [];

                if (
                    $winner?->drawPrize?->prize?->name
                ) {
                    $descriptionParts[] =
                        $winner
                            ->drawPrize
                            ->prize
                            ->name;
                }

                if (
                    $winner?->draw?->week_number
                ) {
                    $descriptionParts[] =
                        'Week '.
                        $winner
                            ->draw
                            ->week_number;
                }

                $meta = [];

                if (
                    $log->action ===
                    'winner.contact_attempt_added'
                ) {
                    $result =
                        $log->new_values[
                            'result'
                        ] ?? null;

                    if ($result) {
                        $meta['result'] =
                            $result;

                        $descriptionParts[] =
                            str($result)
                                ->replace(
                                    '_',
                                    ' '
                                )
                                ->title()
                                ->toString();
                    }
                }

                return [
                    'id' => $log->id,

                    'action' => $log->action,

                    'title' => $title,

                    'description' => ! empty(
                        $descriptionParts
                    )
                            ? implode(
                                ' · ',
                                $descriptionParts
                            )
                            : 'Winner #'.$log->auditable_id,

                    'occurred_at' => $log->created_at,

                    'resource_id' => $log->auditable_id,

                    'meta' => $meta,
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
            ->map(function (
                Prize $prize
            ) {
                $allocated =
                    $prize
                        ->drawPrizes
                        ->sum(
                            'quantity'
                        );

                return [
                    'id' => $prize->id,

                    'name' => $prize->name,

                    'type' => $prize
                        ->type
                        ->value,

                    'total' => $prize
                        ->total_quantity,

                    'allocated' => $allocated,

                    'remaining' => max(
                        0,
                        $prize
                            ->total_quantity -
                        $allocated
                    ),
                ];
            })
            ->values()
            ->all();
    }
}
