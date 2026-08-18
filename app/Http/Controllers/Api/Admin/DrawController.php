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
use App\Services\DrawLifecycleService;
use App\Services\DrawService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class DrawController extends Controller
{
    public function __construct(
        private DrawLifecycleService $drawLifecycleService
    ) {}

    public function index(): JsonResponse
    {
        $draws = Draw::query()
            ->with('drawPrizes.prize')
            ->withCount('entries')
            ->orderBy('week_number')
            ->get();

        $liveEligibleCount = $this->eligibleReceiptsQuery()->count();

        $data = $draws->map(function (Draw $draw) use ($liveEligibleCount) {
            $requiredWinners = (int) $draw->drawPrizes->sum('quantity');

            $eligibleEntriesCount = $draw->snapshot_at
                ? (int) $draw->entries_count
                : $liveEligibleCount;

            $preparationStatus = $this->drawLifecycleService->preparationStatus(
                $draw,
                $requiredWinners,
                $eligibleEntriesCount
            );

            return [
                ...$draw->toArray(),
                'eligible_entries_count' => $eligibleEntriesCount,
                'required_winners' => $requiredWinners,
                'can_prepare' => $preparationStatus['can_prepare'],
                'blocking_reason' => $preparationStatus['blocking_reason'],
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

        $requiredWinners = (int) $draw->drawPrizes->sum('quantity');

        $eligibleEntriesCount = $draw->snapshot_at
            ? $draw->entries->count()
            : $this->eligibleReceiptsQuery()->count();

        $preparationStatus = $this->drawLifecycleService->preparationStatus(
            $draw,
            $requiredWinners,
            $eligibleEntriesCount
        );

        return response()->json([
            'data' => [
                ...$draw->toArray(),
                'eligible_entries_count' => $eligibleEntriesCount,
                'required_winners' => $requiredWinners,
                'can_prepare' => $preparationStatus['can_prepare'],
                'blocking_reason' => $preparationStatus['blocking_reason'],
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

        $draw = DB::transaction(function () use ($request, $data) {
            $draw = Draw::create([
                'week_number' => $data['week_number'],
                'draw_date' => $data['draw_date'],
                'status' => DrawStatus::DRAFT,
                'created_by' => $request->user()->id,
            ]);

            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'draw.created',
                'auditable_type' => Draw::class,
                'auditable_id' => $draw->id,
                'old_values' => null,
                'new_values' => [
                    'week_number' => $draw->week_number,
                    'draw_date' => $draw->draw_date?->toISOString(),
                    'status' => $draw->status->value,
                    'created_by' => $draw->created_by,
                ],
                'description' => 'Draw created.',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            return $draw;
        });

        return response()->json([
            'message' => 'Draw created successfully.',
            'data' => $draw,
        ], 201);
    }

    public function update(Request $request, Draw $draw): JsonResponse
    {
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

        $draw = DB::transaction(function () use ($request, $draw, $data) {
            $draw = Draw::query()
                ->whereKey($draw->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (! in_array($draw->status, [DrawStatus::DRAFT, DrawStatus::SCHEDULED], true)) {
                abort(422, 'This draw can no longer be modified.');
            }

            if ($draw->snapshot_at) {
                abort(422, 'Prepared draws can no longer be modified.');
            }

            $oldValues = [];

            if (array_key_exists('draw_date', $data)) {
                $oldValues['draw_date'] = $draw->draw_date?->toISOString();
            }

            if (array_key_exists('status', $data)) {
                $oldValues['status'] = $draw->status->value;
            }

            $draw->update($data);
            $draw->refresh();

            $newValues = [];

            if (array_key_exists('draw_date', $data)) {
                $newValues['draw_date'] = $draw->draw_date?->toISOString();
            }

            if (array_key_exists('status', $data)) {
                $newValues['status'] = $draw->status->value;
            }

            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'draw.updated',
                'auditable_type' => Draw::class,
                'auditable_id' => $draw->id,
                'old_values' => $oldValues,
                'new_values' => $newValues,
                'description' => 'Draw configuration updated.',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            return $draw;
        });

        return response()->json([
            'message' => 'Draw updated successfully.',
            'data' => $draw,
        ]);
    }

    public function addPrize(Request $request, Draw $draw): JsonResponse
    {
        if (! in_array($draw->status, [DrawStatus::DRAFT, DrawStatus::SCHEDULED], true)) {
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

        $drawPrize = DB::transaction(function () use ($request, $draw, $data) {
            $draw = Draw::query()
                ->whereKey($draw->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (! in_array($draw->status, [DrawStatus::DRAFT, DrawStatus::SCHEDULED], true)) {
                abort(422, 'This draw can no longer be modified.');
            }

            if ($draw->snapshot_at) {
                abort(422, 'Prize allocation is locked after preparation.');
            }

            $prize = Prize::query()
                ->whereKey($data['prize_id'])
                ->lockForUpdate()
                ->firstOrFail();

            $alreadyConfigured = DrawPrize::query()
                ->where('draw_id', $draw->id)
                ->where('prize_id', $prize->id)
                ->exists();

            if ($alreadyConfigured) {
                abort(422, 'This prize is already configured for this draw.');
            }

            $alreadyAllocated = DrawPrize::query()
                ->where('prize_id', $prize->id)
                ->sum('quantity');

            if ($alreadyAllocated + $data['quantity'] > $prize->total_quantity) {
                abort(422, 'Prize allocation exceeds the total available quantity.');
            }

            $drawPrize = DrawPrize::create([
                'draw_id' => $draw->id,
                'prize_id' => $prize->id,
                'quantity' => $data['quantity'],
            ]);

            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'draw.prize_added',
                'auditable_type' => Draw::class,
                'auditable_id' => $draw->id,
                'old_values' => null,
                'new_values' => [
                    'draw_prize_id' => $drawPrize->id,
                    'prize_id' => $prize->id,
                    'prize_name' => $prize->name,
                    'quantity' => $drawPrize->quantity,
                ],
                'description' => 'Prize allocation added to draw.',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            return $drawPrize;
        });

        return response()->json([
            'message' => 'Prize added to draw successfully.',
            'data' => $drawPrize->load('prize'),
        ], 201);
    }

    public function removePrize(
        Request $request,
        Draw $draw,
        DrawPrize $drawPrize
    ): JsonResponse {
        DB::transaction(function () use ($request, $draw, $drawPrize) {
            $draw = Draw::query()
                ->whereKey($draw->id)
                ->lockForUpdate()
                ->firstOrFail();

            $drawPrize = DrawPrize::query()
                ->whereKey($drawPrize->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($drawPrize->draw_id !== $draw->id) {
                abort(404, 'Prize does not belong to this draw.');
            }

            if (! in_array($draw->status, [DrawStatus::DRAFT, DrawStatus::SCHEDULED], true)) {
                abort(422, 'This draw can no longer be modified.');
            }

            if ($draw->snapshot_at) {
                abort(422, 'Prize allocation is locked after preparation.');
            }

            $prize = Prize::find($drawPrize->prize_id);

            $oldValues = [
                'draw_prize_id' => $drawPrize->id,
                'prize_id' => $drawPrize->prize_id,
                'prize_name' => $prize?->name,
                'quantity' => $drawPrize->quantity,
            ];

            $drawPrize->delete();

            AuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'draw.prize_removed',
                'auditable_type' => Draw::class,
                'auditable_id' => $draw->id,
                'old_values' => $oldValues,
                'new_values' => [
                    'removed' => true,
                ],
                'description' => 'Prize allocation removed from draw.',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        });

        return response()->json([
            'message' => 'Prize removed from draw successfully.',
        ]);
    }

    public function createSnapshot(Request $request, Draw $draw): JsonResponse
    {
        $result = DB::transaction(function () use ($request, $draw) {
            $draw = Draw::query()
                ->whereKey($draw->id)
                ->lockForUpdate()
                ->firstOrFail();

            $requiredWinnerCount = (int) $draw->drawPrizes()->sum('quantity');

            $eligibleReceipts = $this->eligibleReceiptsQuery()
                ->orderBy('id')
                ->get(['id']);

            $preparationStatus = $this->drawLifecycleService->preparationStatus(
                $draw,
                $requiredWinnerCount,
                $eligibleReceipts->count()
            );

            if (! $preparationStatus['can_prepare']) {
                abort(422, $preparationStatus['blocking_reason']);
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
