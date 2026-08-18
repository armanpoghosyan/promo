<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\DrawStatus;
use App\Enums\ReceiptStatus;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Draw;
use App\Models\DrawEntry;
use App\Models\DrawPrize;
use App\Models\Prize;
use App\Models\Receipt;
use App\Services\DrawService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class DrawController extends Controller
{
    public function index(): JsonResponse
    {
        $draws = Draw::query()
            ->with('drawPrizes.prize')
            ->withCount('entries')
            ->orderBy('week_number')
            ->get();

        $liveEligibleCount = $this->eligibleReceiptsQuery()->count();

        $data = $draws->map(function (Draw $draw) use ($liveEligibleCount) {
            $requiredWinners = $draw->drawPrizes->sum('quantity');

            $eligibleEntriesCount = $draw->snapshot_at
                ? (int) $draw->entries_count
                : $liveEligibleCount;

            $canPrepare = in_array(
                $draw->status,
                [DrawStatus::DRAFT, DrawStatus::SCHEDULED],
                true
            )
                && !$draw->snapshot_at
                && $requiredWinners > 0
                && $eligibleEntriesCount >= $requiredWinners;

            return [
                ...$draw->toArray(),
                'eligible_entries_count' => $eligibleEntriesCount,
                'required_winners' => $requiredWinners,
                'can_prepare' => $canPrepare,
            ];
        });

        return response()->json([
            'data' => $data,
        ]);
    }

    public function show(Draw $draw): JsonResponse
    {
        $draw->load([
            'drawPrizes.prize',
            'entries',
            'winners.receipt.participant',
            'winners.contactAttempts',
        ]);

        $requiredWinners = $draw->drawPrizes->sum('quantity');

        $eligibleEntriesCount = $draw->snapshot_at
            ? $draw->entries->count()
            : $this->eligibleReceiptsQuery()->count();

        $canPrepare = in_array(
            $draw->status,
            [DrawStatus::DRAFT, DrawStatus::SCHEDULED],
            true
        )
            && !$draw->snapshot_at
            && $requiredWinners > 0
            && $eligibleEntriesCount >= $requiredWinners;

        return response()->json([
            'data' => [
                ...$draw->toArray(),
                'eligible_entries_count' => $eligibleEntriesCount,
                'required_winners' => $requiredWinners,
                'can_prepare' => $canPrepare,
            ],
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
            'status' => DrawStatus::DRAFT,
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Draw created successfully.',
            'data' => $draw,
        ], 201);
    }

    public function update(Request $request, Draw $draw): JsonResponse
    {
        if (!in_array(
            $draw->status,
            [DrawStatus::DRAFT, DrawStatus::SCHEDULED],
            true
        )) {
            return response()->json([
                'message' => 'This draw can no longer be modified.',
            ], 422);
        }

        if ($draw->snapshot_at) {
            return response()->json([
                'message' => 'Prepared draws can no longer be modified.',
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

    public function addPrize(Request $request, Draw $draw): JsonResponse
    {
        if (!in_array(
            $draw->status,
            [DrawStatus::DRAFT, DrawStatus::SCHEDULED],
            true
        )) {
            return response()->json([
                'message' => 'This draw can no longer be modified.',
            ], 422);
        }

        if ($draw->snapshot_at) {
            return response()->json([
                'message' => 'Prize allocation is locked after preparation.',
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

        $drawPrize = DB::transaction(function () use ($draw, $data) {
           $prize = Prize::query()
               ->whereKey($data['prize_id'])
               ->lockForUpdate()
               ->firstOrFail();

           $alreadyConfigured = DrawPrize::query()
               ->where('draw_id', $draw->id)
               ->where('prize_id', $prize->id)
               ->exists();

           if ($alreadyConfigured) {
               abort(
                   422,
                   'This prize is already configured for this draw.'
               );
           }

           $alreadyAllocated = DrawPrize::query()
               ->where('prize_id', $prize->id)
               ->sum('quantity');

           if ($alreadyAllocated + $data['quantity'] > $prize->total_quantity) {
               abort(
                   422,
                   'Prize allocation exceeds the total available quantity.'
               );
           }

            return DrawPrize::create([
                'draw_id' => $draw->id,
                'prize_id' => $prize->id,
                'quantity' => $data['quantity'],
            ]);
        });

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
            $draw->status,
            [DrawStatus::DRAFT, DrawStatus::SCHEDULED],
            true
        )) {
            return response()->json([
                'message' => 'This draw can no longer be modified.',
            ], 422);
        }

        if ($draw->snapshot_at) {
            return response()->json([
                'message' => 'Prize allocation is locked after preparation.',
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
        $result = DB::transaction(function () use ($request, $draw) {
            $draw = Draw::query()
                ->whereKey($draw->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (!in_array(
                $draw->status,
                [DrawStatus::DRAFT, DrawStatus::SCHEDULED],
                true
            )) {
                abort(
                    422,
                    'Only draft or scheduled draws can be prepared.'
                );
            }

            if ($draw->snapshot_at !== null) {
                abort(
                    422,
                    'This draw has already been prepared.'
                );
            }

            $requiredWinnerCount = $draw->drawPrizes()->sum('quantity');

            if ($requiredWinnerCount < 1) {
                abort(
                    422,
                    'At least one prize must be configured.'
                );
            }

            $eligibleReceipts = $this->eligibleReceiptsQuery()
                ->orderBy('id')
                ->get(['id']);

            if ($eligibleReceipts->count() < $requiredWinnerCount) {
                abort(
                    422,
                    sprintf(
                        'Not enough eligible receipts. %d winners are required, but only %d eligible receipts are available.',
                        $requiredWinnerCount,
                        $eligibleReceipts->count()
                    )
                );
            }

            $previousStatus = $draw->status;
            $now = now();

            $entries = [];

            foreach ($eligibleReceipts as $index => $receipt) {
                $entries[] = [
                    'draw_id' => $draw->id,
                    'receipt_id' => $receipt->id,
                    'entry_number' => $index + 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            DrawEntry::insert($entries);

            $draw->update([
                'status' => DrawStatus::RUNNING,
                'snapshot_at' => $now,
            ]);

            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'draw.snapshot_created',
                'auditable_type' => Draw::class,
                'auditable_id' => $draw->id,
                'old_values' => [
                    'status' => $previousStatus->value,
                ],
                'new_values' => [
                    'status' => DrawStatus::RUNNING->value,
                    'entries_count' => count($entries),
                    'required_winners' => $requiredWinnerCount,
                ],
                'description' => 'Draw participant snapshot created.',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            return [
                'draw' => $draw->fresh(),
                'entries_count' => count($entries),
                'required_winners' => $requiredWinnerCount,
            ];
        });

        return response()->json([
            'message' => 'Draw prepared successfully.',
            'data' => $result,
        ]);
    }

    public function execute(
        Request $request,
        Draw $draw,
        DrawService $drawService
    ): JsonResponse {
        try {
            $draw = $drawService->execute(
                $draw,
                $request->user()->id,
                $request->ip(),
                $request->userAgent()
            );

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

    public function prizes(): JsonResponse
    {
        $prizes = Prize::query()
            ->orderBy('id')
            ->get()
            ->map(function (Prize $prize) {
                $allocatedQuantity = DrawPrize::query()
                    ->where('prize_id', $prize->id)
                    ->sum('quantity');

                return [
                    'id' => $prize->id,
                    'name' => $prize->name,
                    'type' => $prize->type,
                    'total_quantity' => $prize->total_quantity,
                    'allocated_quantity' => $allocatedQuantity,
                    'available_quantity' => max(
                        0,
                        $prize->total_quantity - $allocatedQuantity
                    ),
                ];
            });

        return response()->json([
            'data' => $prizes,
        ]);
    }

    private function eligibleReceiptsQuery(): Builder
    {
        return Receipt::query()
            ->where('status', ReceiptStatus::APPROVED)
            ->whereDoesntHave('drawWinners');
    }
}
