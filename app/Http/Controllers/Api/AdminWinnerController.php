<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DrawWinner;
use App\Services\DrawService;
use App\Enums\DrawWinnerStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class AdminWinnerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = DrawWinner::query()
            ->with([
                'draw',
                'drawPrize.prize',
                'receipt.participant',
                'contactAttempts',
            ])
            ->latest('selected_at');

        if ($request->filled('status')) {
            $query->where(
                'status',
                $request->string('status')->toString()
            );
        }

        if ($request->filled('draw_id')) {
            $query->where(
                'draw_id',
                $request->integer('draw_id')
            );
        }

        if ($request->filled('receipt_number')) {
            $query->whereHas('receipt', function ($q) use ($request) {
                $q->where(
                    'receipt_number',
                    'like',
                    '%' . $request->string('receipt_number') . '%'
                );
            });
        }

        $winners = $query->paginate(
            $request->integer('per_page', 20)
        );

        return response()->json($winners);
    }

    public function show(
        DrawWinner $winner
    ): JsonResponse {
        $winner->load([
            'draw',
            'drawPrize.prize',
            'receipt.participant',
            'contactAttempts',
            'replacedWinner',
            'replacementWinner',
        ]);

        return response()->json([
            'data' => $winner,
        ]);
    }

    public function confirm(
        DrawWinner $winner
    ): JsonResponse {
        if (
            $winner->status !== DrawWinnerStatus::SELECTED &&
            $winner->status !== DrawWinnerStatus::CONTACTING
        ) {
            return response()->json([
                'message' => 'This winner cannot be confirmed.',
            ], 422);
        }

        $winner->update([
            'status' => DrawWinnerStatus::CONFIRMED,
            'confirmed_at' => now(),
        ]);

        return response()->json([
            'message' => 'Winner confirmed successfully.',
            'data' => $winner->fresh(),
        ]);
    }

    public function addContactAttempt(
        Request $request,
        DrawWinner $winner
    ): JsonResponse {
        $data = $request->validate([
            'result' => [
                'required',
                'string',
                'max:100',
            ],

            'notes' => [
                'nullable',
                'string',
                'max:5000',
            ],
        ]);

        $attempt = $winner->contactAttempts()->create([
            'created_by' => auth()->id(),
            'attempted_at' => now(),
            'result' => $data['result'],
            'notes' => $data['notes'] ?? null,
        ]);

        if ($winner->status === DrawWinnerStatus::SELECTED) {
            $winner->update([
                'status' => DrawWinnerStatus::CONTACTING,
            ]);
        }

        return response()->json([
            'message' => 'Contact attempt recorded.',
            'data' => $attempt,
        ], 201);
    }

    public function cancel(
        Request $request,
        DrawWinner $winner
    ): JsonResponse {
        if (
            $winner->status !== DrawWinnerStatus::SELECTED &&
            $winner->status !== DrawWinnerStatus::CONTACTING
        ) {
            return response()->json([
                'message' => 'This winner cannot be cancelled.',
            ], 422);
        }

        $data = $request->validate([
            'reason' => [
                'required',
                'string',
                'max:5000',
            ],
        ]);

        $winner->update([
            'status' => DrawWinnerStatus::CANCELLED,
            'cancelled_at' => now(),
            'cancellation_reason' => $data['reason'],
        ]);

        return response()->json([
            'message' => 'Winner cancelled successfully.',
            'data' => $winner->fresh(),
        ]);
    }

    public function replace(
        DrawWinner $winner,
        DrawService $drawService
    ): JsonResponse {
        if ($winner->status !== DrawWinnerStatus::CANCELLED) {
            return response()->json([
                'message' => 'Only a cancelled winner can be replaced.',
            ], 422);
        }

        try {
            $replacement = $drawService
                ->selectReplacementWinner($winner);

            return response()->json([
                'message' => 'Replacement winner selected successfully.',
                'data' => $replacement->fresh(),
            ], 201);
        } catch (Throwable $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
