<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\ContactAttemptResult;
use App\Enums\DrawWinnerStatus;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\DrawWinner;
use App\Services\DrawService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use RuntimeException;
use Throwable;

class WinnerController extends Controller
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
            $receiptNumber = $request
                ->string('receipt_number')
                ->toString();

            $query->whereHas('receipt', function ($query) use ($receiptNumber) {
                $query->where(
                    'receipt_number',
                    'like',
                    '%'.$receiptNumber.'%'
                );
            });
        }

        $perPage = min(
            max($request->integer('per_page', 20), 1),
            100
        );

        return response()->json(
            $query->paginate($perPage)
        );
    }

    public function show(DrawWinner $winner): JsonResponse
    {
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
        Request $request,
        DrawWinner $winner
    ): JsonResponse {
        try {
            $winner = DB::transaction(function () use ($request, $winner) {
                $winner = DrawWinner::query()
                    ->whereKey($winner->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if (! in_array(
                    $winner->status,
                    [
                        DrawWinnerStatus::SELECTED,
                        DrawWinnerStatus::CONTACTING,
                    ],
                    true
                )) {
                    throw new RuntimeException(
                        'This winner cannot be confirmed.'
                    );
                }

                $previousStatus = $winner->status;
                $confirmedAt = now();

                $winner->update([
                    'status' => DrawWinnerStatus::CONFIRMED,
                    'confirmed_at' => $confirmedAt,
                ]);

                $this->audit(
                    $request,
                    $winner,
                    'winner.confirmed',
                    [
                        'status' => $previousStatus->value,
                    ],
                    [
                        'status' => DrawWinnerStatus::CONFIRMED->value,
                        'confirmed_at' => $confirmedAt->toISOString(),
                    ],
                    'Winner confirmed.'
                );

                return $winner;
            });

            return response()->json([
                'message' => 'Winner confirmed successfully.',
                'data' => $winner->fresh([
                    'draw',
                    'drawPrize.prize',
                    'receipt.participant',
                    'contactAttempts',
                    'replacedWinner',
                    'replacementWinner',
                ]),
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function addContactAttempt(
        Request $request,
        DrawWinner $winner
    ): JsonResponse {
        $data = $request->validate([
            'result' => [
                'required',
                Rule::enum(ContactAttemptResult::class),
            ],
            'notes' => [
                'nullable',
                'string',
                'max:5000',
            ],
        ]);

        try {
            $attempt = DB::transaction(function () use (
                $request,
                $winner,
                $data
            ) {
                $winner = DrawWinner::query()
                    ->whereKey($winner->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if (! in_array(
                    $winner->status,
                    [
                        DrawWinnerStatus::SELECTED,
                        DrawWinnerStatus::CONTACTING,
                    ],
                    true
                )) {
                    throw new RuntimeException(
                        'Contact attempts cannot be added to this winner.'
                    );
                }

                $previousStatus = $winner->status;

                $attempt = $winner->contactAttempts()->create([
                    'created_by' => $request->user()->id,
                    'attempted_at' => now(),
                    'result' => $data['result'],
                    'notes' => $data['notes'] ?? null,
                ]);

                if ($winner->status === DrawWinnerStatus::SELECTED) {
                    $winner->update([
                        'status' => DrawWinnerStatus::CONTACTING,
                    ]);
                }

                $this->audit(
                    $request,
                    $winner,
                    'winner.contact_attempt_added',
                    [
                        'status' => $previousStatus->value,
                    ],
                    [
                        'status' => $winner->fresh()->status->value,
                        'contact_attempt_id' => $attempt->id,
                        'result' => $attempt->result->value,
                    ],
                    'Winner contact attempt recorded.'
                );

                return $attempt;
            });

            return response()->json([
                'message' => 'Contact attempt recorded.',
                'data' => $attempt,
            ], 201);
        } catch (Throwable $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function cancel(
        Request $request,
        DrawWinner $winner
    ): JsonResponse {
        $data = $request->validate([
            'reason' => [
                'required',
                'string',
                'max:5000',
            ],
        ]);

        try {
            $winner = DB::transaction(function () use (
                $request,
                $winner,
                $data
            ) {
                $winner = DrawWinner::query()
                    ->whereKey($winner->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if (! in_array(
                    $winner->status,
                    [
                        DrawWinnerStatus::SELECTED,
                        DrawWinnerStatus::CONTACTING,
                    ],
                    true
                )) {
                    throw new RuntimeException(
                        'This winner cannot be cancelled.'
                    );
                }

                $previousStatus = $winner->status;
                $cancelledAt = now();

                $winner->update([
                    'status' => DrawWinnerStatus::CANCELLED,
                    'cancelled_at' => $cancelledAt,
                    'cancellation_reason' => $data['reason'],
                ]);

                $this->audit(
                    $request,
                    $winner,
                    'winner.cancelled',
                    [
                        'status' => $previousStatus->value,
                    ],
                    [
                        'status' => DrawWinnerStatus::CANCELLED->value,
                        'cancelled_at' => $cancelledAt->toISOString(),
                        'reason' => $data['reason'],
                    ],
                    'Winner cancelled.'
                );

                return $winner;
            });

            return response()->json([
                'message' => 'Winner cancelled successfully.',
                'data' => $winner->fresh([
                    'draw',
                    'drawPrize.prize',
                    'receipt.participant',
                    'contactAttempts',
                    'replacedWinner',
                    'replacementWinner',
                ]),
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function replace(
        Request $request,
        DrawWinner $winner,
        DrawService $drawService
    ): JsonResponse {
        try {
            $replacement = $drawService->selectReplacementWinner(
                $winner,
                $request->user()->id,
                $request->ip(),
                $request->userAgent()
            );

            return response()->json([
                'message' => 'Replacement winner selected successfully.',
                'data' => $replacement->fresh([
                    'draw',
                    'drawPrize.prize',
                    'receipt.participant',
                ]),
            ], 201);
        } catch (Throwable $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    private function audit(
        Request $request,
        DrawWinner $winner,
        string $action,
        ?array $oldValues,
        ?array $newValues,
        string $description
    ): void {
        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => $action,
            'auditable_type' => DrawWinner::class,
            'auditable_id' => $winner->id,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'description' => $description,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
    }
}
