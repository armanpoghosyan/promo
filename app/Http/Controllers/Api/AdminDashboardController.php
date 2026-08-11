<?php

namespace App\Http\Controllers\Api;

use App\Enums\ReceiptStatus;
use App\Http\Controllers\Controller;
use App\Models\Receipt;
use App\Models\Prize;
use App\Models\Participant;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $receipts = Receipt::query();

        return response()->json([
            'data' => [
                'participants' => [
                    'total' => Participant::count(),
                ],

                'receipts' => [
                    'total' => (clone $receipts)->count(),

                    'submitted' => (clone $receipts)
                        ->where('status', ReceiptStatus::SUBMITTED)
                        ->count(),

                    'reviewing' => (clone $receipts)
                        ->where('status', ReceiptStatus::REVIEWING)
                        ->count(),

                    'approved' => (clone $receipts)
                        ->where('status', ReceiptStatus::APPROVED)
                        ->count(),

                    'rejected' => (clone $receipts)
                        ->where('status', ReceiptStatus::REJECTED)
                        ->count(),

                    'suspicious' => (clone $receipts)
                        ->where('is_suspicious', true)
                        ->count(),
                ],

                'winners' => [
                    'total' => (clone $receipts)
                        ->where('status', ReceiptStatus::WINNER)
                        ->count(),

                    'cancelled' => (clone $receipts)
                        ->where('status', ReceiptStatus::CANCELLED)
                        ->count(),
                ],

                'prizes' => Prize::query()
                    ->get()
                    ->map(fn (Prize $prize) => [
                        'id' => $prize->id,
                        'name' => $prize->name,
                        'type' => $prize->type,
                        'total_quantity' => $prize->total_quantity,
                        'remaining_quantity' => $prize->remaining_quantity,
                        'distributed_quantity' =>
                            $prize->total_quantity
                            - $prize->remaining_quantity,
                        'value' => $prize->value,
                    ])
                    ->values(),
            ],
        ]);
    }
}
