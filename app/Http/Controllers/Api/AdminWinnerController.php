<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Draw;
use App\Models\DrawWinner;
use App\Models\Prize;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Enums\DrawStatus;
use App\Enums\DrawWinnerStatus;
use App\Enums\ReceiptStatus;
use App\Models\AuditLog;
use App\Models\DrawEntry;
use App\Models\Receipt;
use App\Services\DrawService;
use Throwable;

class AdminWinnerController extends Controller
{

    public function confirm(
        DrawWinner $winner
    ): JsonResponse {
        if ($winner->status !== DrawWinnerStatus::SELECTED &&
            $winner->status !== DrawWinnerStatus::CONTACTING) {

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
}
