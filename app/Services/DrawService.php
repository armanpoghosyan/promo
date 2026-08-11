<?php

namespace App\Services;

use App\Enums\DrawWinnerStatus;
use App\Models\Draw;
use App\Models\DrawEntry;
use App\Models\DrawWinner;
use App\Services\Random\RandomProvider;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class DrawService
{
    public function __construct(
        private RandomProvider $randomProvider
    ) {
    }

    public function execute(Draw $draw): Draw
    {
        return DB::transaction(function () use ($draw) {

            $draw = Draw::query()
                ->with('drawPrizes')
                ->whereKey($draw->id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->validateDraw($draw);

            /*
             * Get the frozen participant snapshot.
             */
            $entries = DrawEntry::query()
                ->where('draw_id', $draw->id)
                ->orderBy('entry_number')
                ->get();

            $entryNumbers = $entries
                ->pluck('entry_number')
                ->values()
                ->all();

            /*
             * Randomize the complete participant list once.
             *
             * Currently this uses LocalRandomProvider.
             * Later it will use Random.org.
             */
            $randomizedEntryNumbers = $this->randomProvider->shuffle(
                $entryNumbers
            );

            /*
             * Save the randomization information.
             *
             * This gives us an audit trail of what was randomized.
             */
            $draw->update([
                'random_provider' => 'local',
                'random_request' => [
                    'entry_count' => count($entryNumbers),
                    'entries' => $entryNumbers,
                ],
                'random_response' => [
                    'values' => $randomizedEntryNumbers,
                ],
                'randomized_at' => now(),
            ]);

            /*
             * Keep track of which position in the randomized
             * list we are currently using.
             */
            $randomIndex = 0;

            foreach ($draw->drawPrizes as $drawPrize) {

                for ($i = 0; $i < $drawPrize->quantity; $i++) {

                    if (
                        !isset(
                            $randomizedEntryNumbers[$randomIndex]
                        )
                    ) {
                        throw new RuntimeException(
                            'Not enough randomized entries for all prizes.'
                        );
                    }

                    $entryNumber =
                        $randomizedEntryNumbers[$randomIndex];

                    $randomIndex++;

                    $entry = $entries->firstWhere(
                        'entry_number',
                        $entryNumber
                    );

                    if (!$entry) {
                        throw new RuntimeException(
                            "Draw entry {$entryNumber} was not found."
                        );
                    }

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

            return $draw->fresh([
                'drawPrizes.prize',
                'entries',
                'winners.receipt',
            ]);
        });
    }

    private function validateDraw(Draw $draw): void
    {
        /*
         * The draw must have a participant snapshot.
         */
        if (!$draw->snapshot_at) {
            throw new RuntimeException(
                'The participant snapshot has not been created.'
            );
        }

        /*
         * A draw must have prizes.
         */
        if ($draw->drawPrizes->isEmpty()) {
            throw new RuntimeException(
                'No prizes have been configured for this draw.'
            );
        }

        /*
         * A draw must have participants.
         */
        $entryCount = $draw->entries()->count();

        if ($entryCount === 0) {
            throw new RuntimeException(
                'The draw has no eligible entries.'
            );
        }

        /*
         * Make sure we don't execute the same draw twice.
         */
        if ($draw->winners()->exists()) {
            throw new RuntimeException(
                'This draw has already been executed.'
            );
        }

        /*
         * Total number of winners required.
         */
        $totalWinners = $draw->drawPrizes->sum('quantity');

        /*
         * One receipt can win only once in a draw.
         */
        if ($totalWinners > $entryCount) {
            throw new RuntimeException(
                'There are not enough eligible entries for all prizes.'
            );
        }
    }
}
