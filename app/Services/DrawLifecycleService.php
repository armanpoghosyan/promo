<?php

namespace App\Services;

use App\Enums\DrawStatus;
use App\Enums\DrawWinnerStatus;
use App\Models\Draw;
use App\Models\DrawWinner;

class DrawLifecycleService
{
    public function preparationStatus(
        Draw $draw,
        int $requiredWinners,
        int $eligibleEntriesCount
    ): array {
        if (! in_array($draw->status, [DrawStatus::DRAFT, DrawStatus::SCHEDULED], true)) {
            return $this->blocked('Only draft or scheduled draws can be prepared.');
        }

        if ($draw->snapshot_at !== null) {
            return $this->blocked('This draw has already been prepared.');
        }

        if ($requiredWinners < 1) {
            return $this->blocked('At least one prize must be configured.');
        }

        $previousDrawBlockingReason = $this->previousDrawBlockingReason($draw);

        if ($previousDrawBlockingReason !== null) {
            return $this->blocked($previousDrawBlockingReason);
        }

        if ($eligibleEntriesCount < $requiredWinners) {
            return $this->blocked(sprintf(
                'Not enough eligible receipts. %d winners are required, but only %d eligible receipts are available.',
                $requiredWinners,
                $eligibleEntriesCount
            ));
        }

        return [
            'can_prepare' => true,
            'blocking_reason' => null,
        ];
    }

    private function previousDrawBlockingReason(Draw $draw): ?string
    {
        if ($draw->week_number <= 1) {
            return null;
        }

        for ($week = 1; $week < $draw->week_number; $week++) {
            $previousDraw = Draw::query()
                ->with([
                    'drawPrizes',
                    'winners.replacementWinner',
                ])
                ->where('week_number', $week)
                ->first();

            if (! $previousDraw) {
                return sprintf(
                    'Week %d draw must be created and settled before Week %d can be prepared.',
                    $week,
                    $draw->week_number
                );
            }

            if ($previousDraw->status !== DrawStatus::COMPLETED) {
                return sprintf(
                    'Week %d draw must be completed before Week %d can be prepared.',
                    $week,
                    $draw->week_number
                );
            }

            $prizeSlots = (int) $previousDraw->drawPrizes->sum('quantity');

            if ($prizeSlots < 1) {
                return sprintf(
                    'Week %d has no configured prize slots.',
                    $week
                );
            }

            $pendingWinner = $previousDraw->winners->first(
                fn (DrawWinner $winner) => in_array(
                    $winner->status,
                    [
                        DrawWinnerStatus::SELECTED,
                        DrawWinnerStatus::CONTACTING,
                    ],
                    true
                )
            );

            if ($pendingWinner) {
                return sprintf(
                    'Week %d still has winners awaiting confirmation.',
                    $week
                );
            }

            $cancelledWithoutReplacement = $previousDraw->winners->first(
                fn (DrawWinner $winner) => $winner->status === DrawWinnerStatus::CANCELLED
                    && $winner->replacementWinner === null
            );

            if ($cancelledWithoutReplacement) {
                return sprintf(
                    'Week %d has a cancelled winner awaiting replacement.',
                    $week
                );
            }

            $confirmedCount = $previousDraw->winners
                ->where('status', DrawWinnerStatus::CONFIRMED)
                ->count();

            if ($confirmedCount !== $prizeSlots) {
                return sprintf(
                    'Week %d does not yet have confirmed winners for all prize slots.',
                    $week
                );
            }
        }

        return null;
    }

    private function blocked(string $reason): array
    {
        return [
            'can_prepare' => false,
            'blocking_reason' => $reason,
        ];
    }
}
