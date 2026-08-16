<?php

namespace App\Services;

use App\Enums\DrawStatus;
use App\Enums\DrawWinnerStatus;
use App\Models\Draw;
use App\Models\DrawEntry;
use App\Models\DrawWinner;
use App\Services\Random\RandomOrgProvider;
use App\Services\Random\RandomProvider;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class DrawService
{
    public function __construct(
        private RandomProvider $randomProvider
    ) {
    }

    public function execute(
        Draw $draw
    ): Draw {
        return DB::transaction(
            function () use ($draw) {
                /*
                 * Lock the draw so it cannot be
                 * executed concurrently.
                 */
                $draw = Draw::query()
                    ->with('drawPrizes')
                    ->whereKey($draw->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $this->validateDraw(
                    $draw
                );

                /*
                 * Get the immutable participant
                 * snapshot.
                 */
                $entries = DrawEntry::query()
                    ->where(
                        'draw_id',
                        $draw->id
                    )
                    ->orderBy(
                        'entry_number'
                    )
                    ->get();

                $entryNumbers =
                    $entries
                        ->pluck(
                            'entry_number'
                        )
                        ->values()
                        ->all();

                /*
                 * IMPORTANT:
                 *
                 * Randomize the COMPLETE frozen
                 * participant list exactly once.
                 *
                 * The resulting order is used for:
                 *
                 * 1. Initial winners
                 * 2. Future replacement winners
                 *
                 * Replacement winners therefore
                 * never require another random
                 * provider request.
                 */
                $randomizedEntryNumbers =
                    $this->randomProvider
                        ->shuffle(
                            $entryNumbers
                        );

                /*
                 * Defensive validation.
                 */
                if (
                    count(
                        $randomizedEntryNumbers
                    ) !==
                    count(
                        $entryNumbers
                    )
                ) {
                    throw new RuntimeException(
                        'Random provider returned an invalid number of entries.'
                    );
                }

                /*
                 * Determine which random provider
                 * executed the draw.
                 */
                $randomProviderName =
                    $this->getRandomProviderName();

                $randomizedAt =
                    now();

                /*
                 * Store the COMPLETE randomization
                 * result.
                 *
                 * This becomes the permanent
                 * auditable order for this draw.
                 */
                $draw->update([
                    'random_provider' =>
                        $randomProviderName,

                    'random_request' => [
                        'entry_count' =>
                            count(
                                $entryNumbers
                            ),

                        'entries' =>
                            $entryNumbers,
                    ],

                    'random_response' => [
                        'values' =>
                            $randomizedEntryNumbers,
                    ],

                    'randomized_at' =>
                        $randomizedAt,
                ]);

                /*
                 * Start from the first position in
                 * the randomized order.
                 */
                $randomIndex = 0;

                /*
                 * Assign winners according to the
                 * configured prize quantities.
                 */
                foreach (
                    $draw->drawPrizes
                    as $drawPrize
                ) {
                    for (
                        $i = 0;
                        $i <
                        $drawPrize->quantity;
                        $i++
                    ) {
                        if (
                            !isset(
                                $randomizedEntryNumbers[
                                    $randomIndex
                                ]
                            )
                        ) {
                            throw new RuntimeException(
                                'Not enough randomized entries for all prizes.'
                            );
                        }

                        $entryNumber =
                            $randomizedEntryNumbers[
                                $randomIndex
                            ];

                        $randomIndex++;

                        $entry =
                            $entries
                                ->firstWhere(
                                    'entry_number',
                                    $entryNumber
                                );

                        if (!$entry) {
                            throw new RuntimeException(
                                "Draw entry {$entryNumber} was not found."
                            );
                        }

                        DrawWinner::create([
                            'draw_id' =>
                                $draw->id,

                            'draw_prize_id' =>
                                $drawPrize->id,

                            'receipt_id' =>
                                $entry->receipt_id,

                            'entry_number' =>
                                $entryNumber,

                            'status' =>
                                DrawWinnerStatus::SELECTED,

                            'selected_at' =>
                                $randomizedAt,
                        ]);
                    }
                }

                /*
                 * Initial winner selection is now
                 * complete.
                 */
                $draw->update([
                    'status' =>
                        DrawStatus::COMPLETED,

                    'completed_at' =>
                        now(),
                ]);

                return $draw->fresh([
                    'drawPrizes.prize',
                    'entries',
                    'winners.receipt.participant',
                ]);
            }
        );
    }

    private function validateDraw(
        Draw $draw
    ): void {
        /*
         * Draw must already have been prepared.
         */
        if (
            $draw->status !==
            DrawStatus::RUNNING
        ) {
            throw new RuntimeException(
                'Only a running draw can be executed.'
            );
        }

        /*
         * Participant snapshot must exist.
         */
        if (!$draw->snapshot_at) {
            throw new RuntimeException(
                'The participant snapshot has not been created.'
            );
        }

        /*
         * Draw must contain prizes.
         */
        if (
            $draw
                ->drawPrizes
                ->isEmpty()
        ) {
            throw new RuntimeException(
                'No prizes have been configured for this draw.'
            );
        }

        /*
         * Snapshot must contain participants.
         */
        $entryCount =
            $draw
                ->entries()
                ->count();

        if ($entryCount === 0) {
            throw new RuntimeException(
                'The draw has no eligible entries.'
            );
        }

        /*
         * Prevent execution more than once.
         */
        if (
            $draw
                ->winners()
                ->exists()
        ) {
            throw new RuntimeException(
                'This draw has already been executed.'
            );
        }

        /*
         * Determine the total number of initial
         * winners required.
         */
        $totalWinners =
            $draw
                ->drawPrizes
                ->sum(
                    'quantity'
                );

        if ($totalWinners < 1) {
            throw new RuntimeException(
                'The draw must contain at least one prize.'
            );
        }

        /*
         * One receipt can win only once during
         * the initial draw.
         */
        if (
            $totalWinners >
            $entryCount
        ) {
            throw new RuntimeException(
                'There are not enough eligible entries for all prizes.'
            );
        }
    }

    public function selectReplacementWinner(
        DrawWinner $cancelledWinner
    ): DrawWinner {
        return DB::transaction(
            function () use (
                $cancelledWinner
            ) {
                /*
                 * Reload and lock the original
                 * cancelled winner.
                 */
                $cancelledWinner =
                    DrawWinner::query()
                        ->whereKey(
                            $cancelledWinner->id
                        )
                        ->lockForUpdate()
                        ->firstOrFail();

                $cancelledWinner->load([
                    'draw',
                    'drawPrize',
                ]);

                /*
                 * Only cancelled winners should
                 * receive replacements.
                 */
                if (
                    $cancelledWinner->status !==
                    DrawWinnerStatus::CANCELLED
                ) {
                    throw new RuntimeException(
                        'Only a cancelled winner can be replaced.'
                    );
                }

                /*
                 * Prevent creating more than one
                 * replacement for the same winner.
                 */
                $existingReplacement =
                    DrawWinner::query()
                        ->where(
                            'replaced_winner_id',
                            $cancelledWinner->id
                        )
                        ->first();

                if (
                    $existingReplacement
                ) {
                    throw new RuntimeException(
                        'This winner has already been replaced.'
                    );
                }

                /*
                 * Lock the draw while selecting
                 * the replacement.
                 */
                $draw = Draw::query()
                    ->whereKey(
                        $cancelledWinner
                            ->draw_id
                    )
                    ->lockForUpdate()
                    ->firstOrFail();

                /*
                 * Replacement selection requires
                 * the original completed
                 * randomization.
                 */
                if (
                    $draw->status !==
                    DrawStatus::COMPLETED
                ) {
                    throw new RuntimeException(
                        'Replacement winners can only be selected for a completed draw.'
                    );
                }

                /*
                 * Read the ORIGINAL randomized
                 * entry order.
                 */
                $randomResponse =
                    $draw->random_response;

                if (
                    is_string(
                        $randomResponse
                    )
                ) {
                    $randomResponse =
                        json_decode(
                            $randomResponse,
                            true
                        );
                }

                if (
                    !is_array(
                        $randomResponse
                    )
                ) {
                    throw new RuntimeException(
                        'The original randomization result is missing.'
                    );
                }

                $randomizedEntryNumbers =
                    $randomResponse[
                        'values'
                    ] ?? null;

                if (
                    !is_array(
                        $randomizedEntryNumbers
                    ) ||
                    empty(
                        $randomizedEntryNumbers
                    )
                ) {
                    throw new RuntimeException(
                        'The original randomized entry order is missing.'
                    );
                }

                /*
                 * Every entry that has ever been
                 * selected as a winner remains
                 * permanently excluded.
                 *
                 * This includes:
                 *
                 * selected
                 * contacting
                 * confirmed
                 * cancelled
                 * previous replacements
                 */
                $alreadySelectedEntryNumbers =
                    DrawWinner::query()
                        ->where(
                            'draw_id',
                            $draw->id
                        )
                        ->whereNotNull(
                            'entry_number'
                        )
                        ->pluck(
                            'entry_number'
                        )
                        ->map(
                            fn ($value) =>
                                (int) $value
                        )
                        ->all();

                $alreadySelectedLookup =
                    array_fill_keys(
                        $alreadySelectedEntryNumbers,
                        true
                    );

                /*
                 * Walk through the ORIGINAL
                 * randomized order.
                 *
                 * The first entry that has never
                 * been selected becomes the
                 * replacement winner.
                 */
                $replacementEntryNumber =
                    null;

                foreach (
                    $randomizedEntryNumbers
                    as $entryNumber
                ) {
                    $entryNumber =
                        (int) $entryNumber;

                    if (
                        isset(
                            $alreadySelectedLookup[
                                $entryNumber
                            ]
                        )
                    ) {
                        continue;
                    }

                    $replacementEntryNumber =
                        $entryNumber;

                    break;
                }

                if (
                    $replacementEntryNumber ===
                    null
                ) {
                    throw new RuntimeException(
                        'There are no reserve entries available for a replacement winner.'
                    );
                }

                /*
                 * Resolve the frozen DrawEntry.
                 */
                $entry =
                    DrawEntry::query()
                        ->where(
                            'draw_id',
                            $draw->id
                        )
                        ->where(
                            'entry_number',
                            $replacementEntryNumber
                        )
                        ->first();

                if (!$entry) {
                    throw new RuntimeException(
                        "Replacement entry {$replacementEntryNumber} was not found."
                    );
                }

                /*
                 * Create a NEW winner.
                 *
                 * The cancelled winner remains
                 * unchanged for full history.
                 */
                return DrawWinner::create([
                    'draw_id' =>
                        $draw->id,

                    'draw_prize_id' =>
                        $cancelledWinner
                            ->draw_prize_id,

                    'receipt_id' =>
                        $entry->receipt_id,

                    'entry_number' =>
                        $replacementEntryNumber,

                    'status' =>
                        DrawWinnerStatus::SELECTED,

                    'selected_at' =>
                        now(),

                    'replaced_winner_id' =>
                        $cancelledWinner->id,
                ]);
            }
        );
    }

    private function getRandomProviderName(): string
    {
        if (
            $this->randomProvider
            instanceof RandomOrgProvider
        ) {
            return 'random.org';
        }

        return 'local';
    }
}
