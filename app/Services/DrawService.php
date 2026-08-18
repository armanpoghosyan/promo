<?php

namespace App\Services;

use App\Enums\DrawStatus;
use App\Enums\DrawWinnerStatus;
use App\Models\AuditLog;
use App\Models\Draw;
use App\Models\DrawEntry;
use App\Models\DrawWinner;
use App\Services\Random\RandomProvider;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class DrawService
{
    public function __construct(private RandomProvider $randomProvider) {}

    public function execute(
        Draw $draw,
        int $userId,
        ?string $ipAddress = null,
        ?string $userAgent = null
    ): Draw {
        return DB::transaction(function () use (
            $draw,
            $userId,
            $ipAddress,
            $userAgent
        ) {
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

            $entryNumbers = $entries
                ->pluck('entry_number')
                ->values()
                ->all();

            $randomResult = $this->randomProvider->shuffle($entryNumbers);
            $randomizedEntryNumbers = $randomResult->values;

            if (count($randomizedEntryNumbers) !== count($entryNumbers)) {
                throw new RuntimeException(
                    'Random provider returned an invalid number of entries.'
                );
            }

            if (
                array_diff($entryNumbers, $randomizedEntryNumbers)
                || array_diff($randomizedEntryNumbers, $entryNumbers)
            ) {
                throw new RuntimeException(
                    'Random provider returned invalid entries.'
                );
            }

            $randomizedAt = now();

            $draw->update([
                'random_provider' => $randomResult->provider,
                'random_request_id' => $randomResult->requestId,
                'random_request' => $randomResult->request,
                'random_response' => $randomResult->response,
                'randomized_at' => $randomizedAt,
            ]);

            $randomIndex = 0;

            foreach ($draw->drawPrizes as $drawPrize) {
                for ($i = 0; $i < $drawPrize->quantity; $i++) {
                    if (! isset($randomizedEntryNumbers[$randomIndex])) {
                        throw new RuntimeException(
                            'Not enough randomized entries for all prizes.'
                        );
                    }

                    $entryNumber = $randomizedEntryNumbers[$randomIndex];
                    $randomIndex++;

                    $entry = $entries->firstWhere(
                        'entry_number',
                        $entryNumber
                    );

                    if (! $entry) {
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
                        'selected_at' => $randomizedAt,
                    ]);
                }
            }

            $completedAt = now();

            $draw->update([
                'status' => DrawStatus::COMPLETED,
                'completed_at' => $completedAt,
            ]);

            AuditLog::create([
                'user_id' => $userId,
                'action' => 'draw.executed',
                'auditable_type' => Draw::class,
                'auditable_id' => $draw->id,
                'old_values' => [
                    'status' => DrawStatus::RUNNING->value,
                ],
                'new_values' => [
                    'status' => DrawStatus::COMPLETED->value,
                    'random_provider' => $randomResult->provider,
                    'random_request_id' => $randomResult->requestId,
                    'entries_count' => count($entryNumbers),
                    'winners_count' => $randomIndex,
                    'randomized_at' => $randomizedAt->toISOString(),
                    'completed_at' => $completedAt->toISOString(),
                ],
                'description' => 'Draw executed and winners selected.',
                'ip_address' => $ipAddress,
                'user_agent' => $userAgent,
            ]);

            return $draw->fresh([
                'drawPrizes.prize',
                'entries',
                'winners.receipt.participant',
            ]);
        });
    }

    public function selectReplacementWinner(
        DrawWinner $cancelledWinner,
        int $userId,
        ?string $ipAddress = null,
        ?string $userAgent = null
    ): DrawWinner {
        return DB::transaction(function () use (
            $cancelledWinner,
            $userId,
            $ipAddress,
            $userAgent
        ) {
            $cancelledWinner = DrawWinner::query()
                ->whereKey($cancelledWinner->id)
                ->lockForUpdate()
                ->firstOrFail();

            $cancelledWinner->load([
                'draw',
                'drawPrize',
            ]);

            if ($cancelledWinner->status !== DrawWinnerStatus::CANCELLED) {
                throw new RuntimeException(
                    'Only a cancelled winner can be replaced.'
                );
            }

            $existingReplacement = DrawWinner::query()
                ->where('replaced_winner_id', $cancelledWinner->id)
                ->first();

            if ($existingReplacement) {
                throw new RuntimeException(
                    'This winner has already been replaced.'
                );
            }

            $draw = Draw::query()
                ->whereKey($cancelledWinner->draw_id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($draw->status !== DrawStatus::COMPLETED) {
                throw new RuntimeException(
                    'Replacement winners can only be selected for a completed draw.'
                );
            }

            $randomResponse = $draw->random_response;

            if (is_string($randomResponse)) {
                $randomResponse = json_decode($randomResponse, true);
            }

            if (! is_array($randomResponse)) {
                throw new RuntimeException(
                    'The original randomization result is missing.'
                );
            }

            $randomizedEntryNumbers = $randomResponse['values'] ?? null;

            if (
                ! is_array($randomizedEntryNumbers)
                || empty($randomizedEntryNumbers)
            ) {
                throw new RuntimeException(
                    'The original randomized entry order is missing.'
                );
            }

            $alreadySelectedEntryNumbers = DrawWinner::query()
                ->where('draw_id', $draw->id)
                ->whereNotNull('entry_number')
                ->pluck('entry_number')
                ->map(fn ($value) => (int) $value)
                ->all();

            $alreadySelectedLookup = array_fill_keys(
                $alreadySelectedEntryNumbers,
                true
            );

            $replacementEntryNumber = null;

            foreach ($randomizedEntryNumbers as $entryNumber) {
                $entryNumber = (int) $entryNumber;

                if (isset($alreadySelectedLookup[$entryNumber])) {
                    continue;
                }

                $replacementEntryNumber = $entryNumber;
                break;
            }

            if ($replacementEntryNumber === null) {
                throw new RuntimeException(
                    'There are no reserve entries available for a replacement winner.'
                );
            }

            $entry = DrawEntry::query()
                ->where('draw_id', $draw->id)
                ->where('entry_number', $replacementEntryNumber)
                ->first();

            if (! $entry) {
                throw new RuntimeException(
                    "Replacement entry {$replacementEntryNumber} was not found."
                );
            }

            $replacement = DrawWinner::create([
                'draw_id' => $draw->id,
                'draw_prize_id' => $cancelledWinner->draw_prize_id,
                'receipt_id' => $entry->receipt_id,
                'entry_number' => $replacementEntryNumber,
                'status' => DrawWinnerStatus::SELECTED,
                'selected_at' => now(),
                'replaced_winner_id' => $cancelledWinner->id,
            ]);

            AuditLog::create([
                'user_id' => $userId,
                'action' => 'winner.replacement_selected',
                'auditable_type' => DrawWinner::class,
                'auditable_id' => $replacement->id,
                'old_values' => [
                    'replaced_winner_id' => $cancelledWinner->id,
                    'entry_number' => $cancelledWinner->entry_number,
                ],
                'new_values' => [
                    'replacement_winner_id' => $replacement->id,
                    'entry_number' => $replacement->entry_number,
                    'draw_prize_id' => $replacement->draw_prize_id,
                ],
                'description' => 'Replacement winner selected.',
                'ip_address' => $ipAddress,
                'user_agent' => $userAgent,
            ]);

            return $replacement;
        });
    }

    private function validateDraw(Draw $draw): void
    {
        if ($draw->status !== DrawStatus::RUNNING) {
            throw new RuntimeException(
                'Only a running draw can be executed.'
            );
        }

        if (! $draw->snapshot_at) {
            throw new RuntimeException(
                'The participant snapshot has not been created.'
            );
        }

        if ($draw->drawPrizes->isEmpty()) {
            throw new RuntimeException(
                'No prizes have been configured for this draw.'
            );
        }

        $entryCount = $draw->entries()->count();

        if ($entryCount === 0) {
            throw new RuntimeException(
                'The draw has no eligible entries.'
            );
        }

        if ($draw->winners()->exists()) {
            throw new RuntimeException(
                'This draw has already been executed.'
            );
        }

        $totalWinners = $draw->drawPrizes->sum('quantity');

        if ($totalWinners < 1) {
            throw new RuntimeException(
                'The draw must contain at least one prize.'
            );
        }

        if ($totalWinners > $entryCount) {
            throw new RuntimeException(
                'There are not enough eligible entries for all prizes.'
            );
        }
    }
}
