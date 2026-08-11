<?php

namespace App\Console\Commands;

use App\Enums\DrawWinnerStatus;
use App\Models\DrawWinner;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ProcessExpiredWinners extends Command
{
    protected $signature = 'promo:process-expired-winners';

    protected $description = 'Cancel expired winners and select replacement winners';

    public function handle(): int
    {
        $expirationTime = now()->subDays(3);

        $winners = DrawWinner::query()
            ->whereIn('status', [
                DrawWinnerStatus::SELECTED,
                DrawWinnerStatus::CONTACTING,
            ])
            ->where('selected_at', '<=', $expirationTime)
            ->with([
                'draw.drawPrizes',
                'draw.entries',
                'draw.winners',
            ])
            ->get();

        foreach ($winners as $winner) {
            DB::transaction(function () use ($winner) {
                $winner->refresh();

                if (!in_array($winner->status, [
                    DrawWinnerStatus::SELECTED,
                    DrawWinnerStatus::CONTACTING,
                ], true)) {
                    return;
                }

                if (
                    !$winner->selected_at ||
                    $winner->selected_at->gt(
                        now()->subDays(3)
                    )
                ) {
                    return;
                }

                $winner->update([
                    'status' => DrawWinnerStatus::CANCELLED,
                    'cancelled_at' => now(),
                    'cancellation_reason' =>
                        'Winner did not confirm the prize within 3 days.',
                ]);

                $this->selectReplacementWinner($winner);
            });
        }

        $this->info(
            "Processed {$winners->count()} expired winner(s)."
        );

        return self::SUCCESS;
    }

    private function selectReplacementWinner(
        DrawWinner $cancelledWinner
    ): void {
        $replacement = app(
            \App\Services\DrawService::class
        )->selectReplacementWinner(
            $cancelledWinner
        );

        $this->info(
            "Replacement winner #{$replacement->id} selected."
        );
    }
}
