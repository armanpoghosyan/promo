<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Receipt;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use App\Models\DrawWinner;
use App\Models\Draw;

class ReportExportController extends Controller
{
    public function receipts(): StreamedResponse
    {
        $filename = 'receipts-' . now()->format('Y-m-d-His') . '.csv';

        return response()->streamDownload(function () {
            $handle = fopen('php://output', 'w');

            /*
             * CSV header
             */
            fputcsv($handle, [
                'ID',
                'Participant ID',
                'Receipt Number',
                'Status',
                'Created At',
                'Updated At',
            ]);

            Receipt::query()
                ->with('participant')
                ->orderBy('id')
                ->chunk(500, function ($receipts) use ($handle) {
                    foreach ($receipts as $receipt) {
                        fputcsv($handle, [
                            $receipt->id,
                            $receipt->participant_id,
                            $receipt->receipt_number,
                            $receipt->status?->value
                                ?? $receipt->status,
                            $receipt->created_at?->toDateTimeString(),
                            $receipt->updated_at?->toDateTimeString(),
                        ]);
                    }
                });

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function winners(): StreamedResponse
    {
        $filename = 'winners-' . now()->format('Y-m-d-His') . '.csv';

        return response()->streamDownload(function () {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, [
                'ID',
                'Draw ID',
                'Week',
                'Prize',
                'Receipt ID',
                'Entry Number',
                'Status',
                'Selected At',
                'Confirmed At',
                'Cancelled At',
                'Cancellation Reason',
            ]);

            DrawWinner::query()
                ->with([
                    'draw',
                    'drawPrize.prize',
                ])
                ->orderBy('id')
                ->chunk(500, function ($winners) use ($handle) {
                    foreach ($winners as $winner) {
                        fputcsv($handle, [
                            $winner->id,
                            $winner->draw_id,
                            $winner->draw?->week_number,
                            $winner->drawPrize?->prize?->name,
                            $winner->receipt_id,
                            $winner->entry_number,
                            $winner->status?->value
                                ?? $winner->status,
                            $winner->selected_at?->toDateTimeString(),
                            $winner->confirmed_at?->toDateTimeString(),
                            $winner->cancelled_at?->toDateTimeString(),
                            $winner->cancellation_reason,
                        ]);
                    }
                });

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function draws(): StreamedResponse
    {
        $filename = 'draws-' . now()->format('Y-m-d-His') . '.csv';

        return response()->streamDownload(function () {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, [
                'Draw ID',
                'Week',
                'Draw Date',
                'Status',
                'Eligible Entries',
                'Prize',
                'Prize Type',
                'Prize Quantity',
                'Total Winners',
                'Selected Winners',
                'Confirmed Winners',
                'Cancelled Winners',
            ]);

            Draw::query()
                ->with([
                    'drawPrizes.prize',
                    'entries',
                    'winners',
                ])
                ->orderBy('week_number')
                ->chunk(100, function ($draws) use ($handle) {
                    foreach ($draws as $draw) {

                        $totalWinners = $draw->winners->count();

                        $selectedWinners = $draw->winners
                            ->where('status', \App\Enums\DrawWinnerStatus::SELECTED)
                            ->count();

                        $confirmedWinners = $draw->winners
                            ->where('status', \App\Enums\DrawWinnerStatus::CONFIRMED)
                            ->count();

                        $cancelledWinners = $draw->winners
                            ->where('status', \App\Enums\DrawWinnerStatus::CANCELLED)
                            ->count();

                        foreach ($draw->drawPrizes as $drawPrize) {
                            fputcsv($handle, [
                                $draw->id,
                                $draw->week_number,
                                $draw->draw_date?->toDateTimeString(),
                                $draw->status?->value ?? $draw->status,
                                $draw->entries->count(),
                                $drawPrize->prize?->name,
                                $drawPrize->prize?->type?->value
                                    ?? $drawPrize->prize?->type,
                                $drawPrize->quantity,
                                $totalWinners,
                                $selectedWinners,
                                $confirmedWinners,
                                $cancelledWinners,
                            ]);
                        }
                    }
                });

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
