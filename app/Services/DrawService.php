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

            $draw->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);

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
         * A draw must be running.
         */
        if ($draw->status->value !== 'running') {
            throw new RuntimeException(
                'Only a running draw can be executed.'
            );
        }

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

    public function selectReplacementWinner(
        DrawWinner $cancelledWinner
    ): DrawWinner {
        return DB::transaction(function () use ($cancelledWinner) {

            $cancelledWinner->load([
                'draw',
                'drawPrize',
            ]);

            $draw = Draw::query()
                ->with('drawPrizes')
                ->whereKey($cancelledWinner->draw_id)
                ->lockForUpdate()
                ->firstOrFail();

            /*
             * Find entries that have NOT already won
             * in this draw.
             */
            $alreadyWonEntryNumbers = DrawWinner::query()
                ->where('draw_id', $draw->id)
                ->whereNotNull('entry_number')
                ->pluck('entry_number');

            $eligibleEntries = DrawEntry::query()
                ->where('draw_id', $draw->id)
                ->whereNotIn(
                    'entry_number',
                    $alreadyWonEntryNumbers
                )
                ->where(
                    'entry_number',
                    '!=',
                    $cancelledWinner->entry_number
                )
                ->get();

            if ($eligibleEntries->isEmpty()) {
                throw new RuntimeException(
                    'There are no eligible entries for a replacement winner.'
                );
            }

            /*
             * Randomize the eligible entries.
             */
            $entryNumbers = $eligibleEntries
                ->pluck('entry_number')
                ->values()
                ->all();

            $randomizedEntryNumbers =
                $this->randomProvider->shuffle($entryNumbers);

            $entryNumber = $randomizedEntryNumbers[0];

            $entry = $eligibleEntries->firstWhere(
                'entry_number',
                $entryNumber
            );

            if (!$entry) {
                throw new RuntimeException(
                    "Replacement entry {$entryNumber} was not found."
                );
            }

            /*
             * Create a NEW winner.
             *
             * The cancelled winner remains untouched.
             */
            return DrawWinner::create([
                'draw_id' => $draw->id,
                'draw_prize_id' => $cancelledWinner->draw_prize_id,
                'receipt_id' => $entry->receipt_id,
                'entry_number' => $entryNumber,
                'status' => DrawWinnerStatus::SELECTED,
                'selected_at' => now(),
                'replaced_winner_id' => $cancelledWinner->id,
            ]);
        });
    }
}
