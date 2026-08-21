<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\DrawWinnerStatus;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Draw;
use App\Models\DrawWinner;
use App\Models\Receipt;
use App\Models\User;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportExportController extends Controller
{
    public function receipts(
        Request $request
    ): StreamedResponse {
        $filename =
            'receipts-'.
            now()->format('Y-m-d-His').
            '.csv';

        $this->auditExport(
            $request,
            'report.receipts_exported',
            $filename,
            'Receipt report exported.'
        );

        return response()->streamDownload(
            function () {
                $handle = fopen(
                    'php://output',
                    'w'
                );

                fwrite(
                    $handle,
                    "\xEF\xBB\xBF"
                );

                $this->writeCsvRow($handle, [
                    'ID',
                    'Participant ID',
                    'First Name',
                    'Last Name',
                    'Phone',
                    'Email',
                    'Receipt Number',
                    'Status',
                    'Suspicious',
                    'Suspicious Reasons',
                    'Submitted At',
                    'Verified At',
                    'Verified By',
                    'Rejection Reason',
                ]);

                Receipt::query()
                    ->with([
                        'participant',
                        'verifiedBy',
                    ])
                    ->orderBy('id')
                    ->chunk(
                        500,
                        function ($receipts) use (
                            $handle
                        ) {
                            foreach (
                                $receipts as $receipt
                            ) {
                                $this->writeCsvRow(
                                    $handle,
                                    [
                                        $receipt->id,
                                        $receipt
                                            ->participant_id,
                                        $receipt
                                            ->participant
                                            ?->first_name,
                                        $receipt
                                            ->participant
                                            ?->last_name,
                                        $receipt
                                            ->participant
                                            ?->phone,
                                        $receipt
                                            ->participant
                                            ?->email,
                                        $receipt
                                            ->receipt_number,
                                        $receipt
                                            ->status
                                            ->value,
                                        $receipt
                                            ->is_suspicious
                                            ? 'yes'
                                            : 'no',
                                        implode(
                                            ', ',
                                            $receipt
                                                ->suspicious_reasons
                                                ?? []
                                        ),
                                        $receipt
                                            ->submitted_at
                                            ?->toDateTimeString(),
                                        $receipt
                                            ->verified_at
                                            ?->toDateTimeString(),
                                        $receipt
                                            ->verifiedBy
                                            ?->email,
                                        $receipt
                                            ->rejection_reason,
                                    ]
                                );
                            }
                        }
                    );

                fclose($handle);
            },
            $filename,
            [
                'Content-Type' => 'text/csv; charset=UTF-8',
            ]
        );
    }

    public function winners(
        Request $request
    ): StreamedResponse {
        $filename =
            'winners-'.
            now()->format('Y-m-d-His').
            '.csv';

        $this->auditExport(
            $request,
            'report.winners_exported',
            $filename,
            'Winner report exported.'
        );

        return response()->streamDownload(
            function () {
                $handle = fopen(
                    'php://output',
                    'w'
                );

                fwrite(
                    $handle,
                    "\xEF\xBB\xBF"
                );

                $this->writeCsvRow($handle, [
                    'Winner Record ID',
                    'Draw ID',
                    'Week',
                    'Prize',
                    'Receipt ID',
                    'Receipt Number',
                    'Participant ID',
                    'First Name',
                    'Last Name',
                    'Phone',
                    'Email',
                    'Entry Number',
                    'Status',
                    'Selected At',
                    'Confirmed At',
                    'Cancelled At',
                    'Cancellation Reason',
                    'Replaced Winner ID',
                    'Replacement Winner ID',
                ]);

                DrawWinner::query()
                    ->with([
                        'draw',
                        'drawPrize.prize',
                        'receipt.participant',
                        'replacementWinner',
                    ])
                    ->orderBy('id')
                    ->chunk(
                        500,
                        function ($winners) use (
                            $handle
                        ) {
                            foreach (
                                $winners as $winner
                            ) {
                                $participant =
                                    $winner
                                        ->receipt
                                        ?->participant;

                                $this->writeCsvRow(
                                    $handle,
                                    [
                                        $winner->id,
                                        $winner->draw_id,
                                        $winner
                                            ->draw
                                            ?->week_number,
                                        $winner
                                            ->drawPrize
                                            ?->prize
                                            ?->name,
                                        $winner
                                            ->receipt_id,
                                        $winner
                                            ->receipt
                                            ?->receipt_number,
                                        $participant?->id,
                                        $participant
                                            ?->first_name,
                                        $participant
                                            ?->last_name,
                                        $participant
                                            ?->phone,
                                        $participant
                                            ?->email,
                                        $winner
                                            ->entry_number,
                                        $winner
                                            ->status
                                            ->value,
                                        $winner
                                            ->selected_at
                                            ?->toDateTimeString(),
                                        $winner
                                            ->confirmed_at
                                            ?->toDateTimeString(),
                                        $winner
                                            ->cancelled_at
                                            ?->toDateTimeString(),
                                        $winner
                                            ->cancellation_reason,
                                        $winner
                                            ->replaced_winner_id,
                                        $winner
                                            ->replacementWinner
                                            ?->id,
                                    ]
                                );
                            }
                        }
                    );

                fclose($handle);
            },
            $filename,
            [
                'Content-Type' => 'text/csv; charset=UTF-8',
            ]
        );
    }

    public function draws(
        Request $request
    ): StreamedResponse {
        $filename =
            'draws-'.
            now()->format('Y-m-d-His').
            '.csv';

        $this->auditExport(
            $request,
            'report.draws_exported',
            $filename,
            'Draw report exported.'
        );

        return response()->streamDownload(
            function () {
                $handle = fopen(
                    'php://output',
                    'w'
                );

                fwrite(
                    $handle,
                    "\xEF\xBB\xBF"
                );

                $this->writeCsvRow($handle, [
                    'Draw ID',
                    'Week',
                    'Draw Date',
                    'Status',
                    'Snapshot Entries',
                    'Prize',
                    'Prize Type',
                    'Prize Slots',
                    'Winner Records',
                    'Active Winners',
                    'Selected',
                    'Contacting',
                    'Confirmed',
                    'Cancelled',
                    'Replacements',
                    'Random Provider',
                    'Random Request ID',
                    'Randomized At',
                ]);

                Draw::query()
                    ->with([
                        'drawPrizes.prize',
                        'entries',
                        'winners',
                    ])
                    ->orderBy('week_number')
                    ->chunk(
                        100,
                        function ($draws) use (
                            $handle
                        ) {
                            foreach (
                                $draws as $draw
                            ) {
                                $selected =
                                    $draw
                                        ->winners
                                        ->where(
                                            'status',
                                            DrawWinnerStatus::SELECTED
                                        )
                                        ->count();

                                $contacting =
                                    $draw
                                        ->winners
                                        ->where(
                                            'status',
                                            DrawWinnerStatus::CONTACTING
                                        )
                                        ->count();

                                $confirmed =
                                    $draw
                                        ->winners
                                        ->where(
                                            'status',
                                            DrawWinnerStatus::CONFIRMED
                                        )
                                        ->count();

                                $cancelled =
                                    $draw
                                        ->winners
                                        ->where(
                                            'status',
                                            DrawWinnerStatus::CANCELLED
                                        )
                                        ->count();

                                $activeWinners =
                                    $selected +
                                    $contacting +
                                    $confirmed;

                                $replacements =
                                    $draw
                                        ->winners
                                        ->whereNotNull(
                                            'replaced_winner_id'
                                        )
                                        ->count();

                                foreach (
                                    $draw
                                        ->drawPrizes as $drawPrize
                                ) {
                                    $this->writeCsvRow(
                                        $handle,
                                        [
                                            $draw->id,
                                            $draw
                                                ->week_number,
                                            $draw
                                                ->draw_date
                                                ?->toDateTimeString(),
                                            $draw
                                                ->status
                                                ->value,
                                            $draw
                                                ->entries
                                                ->count(),
                                            $drawPrize
                                                ->prize
                                                ?->name,
                                            $drawPrize
                                                ->prize
                                                ?->type
                                                ?->value,
                                            $drawPrize
                                                ->quantity,
                                            $draw
                                                ->winners
                                                ->count(),
                                            $activeWinners,
                                            $selected,
                                            $contacting,
                                            $confirmed,
                                            $cancelled,
                                            $replacements,
                                            $draw
                                                ->random_provider,
                                            $draw
                                                ->random_request_id,
                                            $draw
                                                ->randomized_at
                                                ?->toDateTimeString(),
                                        ]
                                    );
                                }
                            }
                        }
                    );

                fclose($handle);
            },
            $filename,
            [
                'Content-Type' => 'text/csv; charset=UTF-8',
            ]
        );
    }

    private function auditExport(
        Request $request,
        string $action,
        string $filename,
        string $description
    ): void {
        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => $action,
            'auditable_type' => User::class,
            'auditable_id' => $request->user()->id,
            'old_values' => null,
            'new_values' => [
                'filename' => $filename,
            ],
            'description' => $description,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
    }

    /**
     * @param  resource  $handle
     */
    private function writeCsvRow($handle, array $values): void
    {
        fputcsv(
            $handle,
            array_map(
                fn (mixed $value): mixed => $this->sanitizeCsvCell($value),
                $values
            )
        );
    }

    private function sanitizeCsvCell(mixed $value): mixed
    {
        if (! is_string($value)) {
            return $value;
        }

        if (preg_match('/^\\s*[=+\-@]/u', $value) === 1) {
            return "'".$value;
        }

        return $value;
    }
}
