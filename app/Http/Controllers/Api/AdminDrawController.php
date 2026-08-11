<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Draw;
use App\Models\DrawPrize;
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

class AdminDrawController extends Controller
{
    public function index(): JsonResponse
    {
        $draws = Draw::query()
            ->with([
                'drawPrizes.prize',
            ])
            ->orderBy('week_number')
            ->get();

        return response()->json([
            'data' => $draws,
        ]);
    }

    public function show(Draw $draw): JsonResponse
    {
        $draw->load([
            'drawPrizes.prize',
            'entries',
            'winners.receipt',
        ]);

        return response()->json([
            'data' => $draw,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'week_number' => [
                'required',
                'integer',
                'min:1',
                'max:5',
                'unique:draws,week_number',
            ],

            'draw_date' => [
                'required',
                'date',
            ],
        ]);

        $draw = Draw::create([
            'week_number' => $data['week_number'],
            'draw_date' => $data['draw_date'],
            'status' => 'draft',
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Draw created successfully.',
            'data' => $draw,
        ], 201);
    }

    public function update(
        Request $request,
        Draw $draw
    ): JsonResponse {
        if (!in_array(
            $draw->status->value,
            ['draft', 'scheduled'],
            true
        )) {
            return response()->json([
                'message' => 'This draw can no longer be modified.',
            ], 422);
        }

        $data = $request->validate([
            'draw_date' => [
                'sometimes',
                'required',
                'date',
            ],

            'status' => [
                'sometimes',
                'required',
                'in:draft,scheduled',
            ],
        ]);

        $draw->update($data);

        return response()->json([
            'message' => 'Draw updated successfully.',
            'data' => $draw->fresh(),
        ]);
    }

    public function addPrize(
        Request $request,
        Draw $draw
    ): JsonResponse {
        if (!in_array(
            $draw->status->value,
            ['draft', 'scheduled'],
            true
        )) {
            return response()->json([
                'message' => 'This draw can no longer be modified.',
            ], 422);
        }

        $data = $request->validate([
            'prize_id' => [
                'required',
                'integer',
                'exists:prizes,id',
            ],

            'quantity' => [
                'required',
                'integer',
                'min:1',
            ],
        ]);

        $prize = Prize::findOrFail($data['prize_id']);

        $alreadyAllocated = DrawPrize::query()
            ->where('prize_id', $prize->id)
            ->sum('quantity');

        $newTotal = $alreadyAllocated + $data['quantity'];

        if ($newTotal > $prize->total_quantity) {
            return response()->json([
                'message' => 'Prize allocation exceeds the total available quantity.',
                'available' => max(
                    0,
                    $prize->total_quantity - $alreadyAllocated
                ),
            ], 422);
        }

        $drawPrize = DrawPrize::create([
            [
                'draw_id' => $draw->id,
                'prize_id' => $prize->id,
            ],
            [
                'quantity' => $data['quantity'],
            ]
        ]);

        return response()->json([
            'message' => 'Prize added to draw successfully.',
            'data' => $drawPrize->load('prize'),
        ], 201);
    }

    public function removePrize(
        Draw $draw,
        DrawPrize $drawPrize
    ): JsonResponse {
        if ($drawPrize->draw_id !== $draw->id) {
            return response()->json([
                'message' => 'Prize does not belong to this draw.',
            ], 404);
        }

        if (!in_array(
            $draw->status->value,
            ['draft', 'scheduled'],
            true
        )) {
            return response()->json([
                'message' => 'This draw can no longer be modified.',
            ], 422);
        }

        $drawPrize->delete();

        return response()->json([
            'message' => 'Prize removed from draw successfully.',
        ]);
    }

    public function createSnapshot(
        Request $request,
        Draw $draw
    ): JsonResponse {
        $result = DB::transaction(function () use (
            $request,
            $draw
        ) {
            $draw = Draw::query()
                ->whereKey($draw->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($draw->status !== DrawStatus::DRAFT) {
                abort(422, 'Only draft draws can be started.');
            }

            $drawPrizeCount = $draw->drawPrizes()->count();

            if ($drawPrizeCount === 0) {
                abort(
                    422,
                    'At least one prize must be configured.'
                );
            }

            $eligibleReceipts = Receipt::query()
                ->where('status', ReceiptStatus::APPROVED)
                ->whereDoesntHave('drawWinners', function ($query) {
                    $query->whereIn('status', [
                        DrawWinnerStatus::SELECTED->value,
                        DrawWinnerStatus::CONFIRMED->value,
                    ]);
                })
                ->orderBy('id')
                ->get([
                    'id',
                ]);

            if ($eligibleReceipts->isEmpty()) {
                abort(
                    422,
                    'There are no eligible receipts for this draw.'
                );
            }

            $entries = [];

            foreach (
                $eligibleReceipts as $index => $receipt
            ) {
                $entries[] = [
                    'draw_id' => $draw->id,
                    'receipt_id' => $receipt->id,
                    'entry_number' => $index + 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            DrawEntry::insert($entries);

            $draw->update([
                'status' => DrawStatus::RUNNING,
                'started_at' => now(),
                'snapshot_at' => now(),
            ]);

            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'draw.snapshot_created',
                'auditable_type' => Draw::class,
                'auditable_id' => $draw->id,
                'old_values' => [
                    'status' => DrawStatus::DRAFT->value,
                ],
                'new_values' => [
                    'status' => DrawStatus::RUNNING->value,
                    'entries_count' => count($entries),
                ],
                'description' => 'Draw participant snapshot created.',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            return [
                'draw' => $draw->fresh(),
                'entries_count' => count($entries),
            ];
        });

        return response()->json([
            'message' => 'Draw snapshot created successfully.',
            'data' => [
                'draw' => $result['draw'],
                'entries_count' => $result['entries_count'],
            ],
        ]);
    }

    public function execute(
        Draw $draw,
        DrawService $drawService
    ): JsonResponse {
        try {
            $draw = $drawService->execute($draw);

            return response()->json([
                'message' => 'Draw executed successfully.',
                'data' => $draw,
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
