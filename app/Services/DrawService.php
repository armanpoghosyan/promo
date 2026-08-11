<?php

namespace App\Services;

use App\Models\Draw;
use App\Models\DrawEntry;
use App\Models\DrawPrize;
use App\Models\DrawWinner;
use App\Enums\DrawWinnerStatus;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class DrawService
{
    public function execute(Draw $draw): Draw
    {
        return DB::transaction(function () use ($draw) {
            $draw = Draw::query()
                ->with('drawPrizes')
                ->whereKey($draw->id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->validateDraw($draw);

            $entries = DrawEntry::query()
                ->where('draw_id', $draw->id)
                ->orderBy('entry_number')
                ->get();

            $availableEntryNumbers = $entries
                ->pluck('entry_number')
                ->values()
                ->all();

            foreach ($draw->drawPrizes as $drawPrize) {
                for ($i = 0; $i < $drawPrize->quantity; $i++) {
                    if (empty($availableEntryNumbers)) {
                        throw new RuntimeException(
                            'Not enough eligible entries to complete the draw.'
                        );
                    }

                    $entryNumber = $this->randomEntryNumber(
                        $availableEntryNumbers
                    );

                    $availableEntryNumbers = array_values(
                        array_diff(
                            $availableEntryNumbers,
                            [$entryNumber]
                        )
                    );

                    $entry = $entries->firstWhere(
                        'entry_number',
                        $entryNumber
                    );

                    DrawWinner::create([
                        'draw_id' => $draw->id,
                        'draw_prize_id' => $drawPrize->id,
                        'receipt_id' => $entry->receipt_id,
                        'entry_number' => $entryNumber,
                        'status' => DrawWinnerStatus::SELECTED,
                        'selected_at' => now(),
                    ]);
                }
            }

            /*
             * IMPORTANT:
             * Do not mark the draw as completed here if
             * your business process considers the draw completed
             * only after winners are confirmed.
             *
             * We'll finalize this status in the winner-management step.
             */

            return $draw->fresh([
                'drawPrizes.prize',
                'entries',
                'winners.receipt',
            ]);
        });
    }

    private function validateDraw(Draw $draw): void
    {
        if ($draw->drawPrizes->isEmpty()) {
            throw new RuntimeException(
                'No prizes have been configured for this draw.'
            );
        }

        if (!$draw->snapshot_at) {
            throw new RuntimeException(
                'The participant snapshot has not been created.'
            );
        }

        if ($draw->entries()->count() === 0) {
            throw new RuntimeException(
                'The draw has no eligible entries.'
            );
        }

        $totalWinners = $draw->drawPrizes->sum('quantity');

        if ($totalWinners > $draw->entries()->count()) {
            throw new RuntimeException(
                'There are not enough eligible entries for all prizes.'
            );
        }
    }

    private function randomEntryNumber(
        array $entryNumbers
    ): int {
        /*
         * Temporary implementation.
         *
         * This will be replaced with the Random.org
         * integration in the next part.
         */
        return $entryNumbers[
            random_int(0, count($entryNumbers) - 1)
        ];
    }
}
