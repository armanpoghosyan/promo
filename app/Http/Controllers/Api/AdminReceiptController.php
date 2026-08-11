<?php

namespace App\Http\Controllers\Api;

use App\Enums\ReceiptStatus;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Receipt;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdminReceiptController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Receipt::query()
            ->with('participant');

        if ($request->filled('status')) {
            $query->where(
                'status',
                $request->string('status')->toString()
            );
        }

        if ($request->filled('receipt_number')) {
            $query->where(
                'receipt_number',
                'like',
                '%' . $request->string('receipt_number') . '%'
            );
        }

        if ($request->filled('phone')) {
            $query->whereHas('participant', function ($q) use ($request) {
                $q->where(
                    'phone',
                    'like',
                    '%' . $request->string('phone') . '%'
                );
            });
        }

        if ($request->filled('email')) {
            $query->whereHas('participant', function ($q) use ($request) {
                $q->where(
                    'email',
                    'like',
                    '%' . $request->string('email') . '%'
                );
            });
        }

        if ($request->boolean('suspicious')) {
            $query->where('is_suspicious', true);
        }

        $receipts = $query
            ->latest()
            ->paginate(
                $request->integer('per_page', 20)
            );

        return response()->json($receipts);
    }

    public function show(
        Receipt $receipt
    ): JsonResponse {
        $receipt->load([
            'participant',
        ]);

        return response()->json([
            'data' => $receipt,
        ]);
    }

    public function approve(
        Request $request,
        Receipt $receipt
    ): JsonResponse {
        if ($receipt->status !== ReceiptStatus::SUBMITTED) {
            return response()->json([
                'message' => 'Only submitted receipts can be approved.',
            ], 422);
        }

        $oldStatus = $receipt->status->value;

        $receipt->update([
            'status' => ReceiptStatus::APPROVED,
            'verified_at' => now(),
            'verified_by' => $request->user()->id,
        ]);

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'receipt.approved',
            'auditable_type' => Receipt::class,
            'auditable_id' => $receipt->id,
            'old_values' => [
                'status' => $oldStatus,
            ],
            'new_values' => [
                'status' => ReceiptStatus::APPROVED->value,
            ],
            'description' => 'Receipt approved by organizer.',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'message' => 'Receipt approved successfully.',
            'data' => $receipt->fresh(),
        ]);
    }

    public function reject(
        Request $request,
        Receipt $receipt
    ): JsonResponse {
        $data = $request->validate([
            'reason' => [
                'required',
                'string',
                'max:1000',
            ],
        ]);

        if ($receipt->status === ReceiptStatus::WINNER) {
            return response()->json([
                'message' => 'A winning receipt cannot be rejected directly.',
            ], 422);
        }

        $oldStatus = $receipt->status->value;

        $receipt->update([
            'status' => ReceiptStatus::REJECTED,
            'rejection_reason' => $data['reason'],
        ]);

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'receipt.rejected',
            'auditable_type' => Receipt::class,
            'auditable_id' => $receipt->id,
            'old_values' => [
                'status' => $oldStatus,
            ],
            'new_values' => [
                'status' => ReceiptStatus::REJECTED->value,
                'rejection_reason' => $data['reason'],
            ],
            'description' => 'Receipt rejected by organizer.',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'message' => 'Receipt rejected successfully.',
            'data' => $receipt->fresh(),
        ]);
    }

    public function addNote(
        Request $request,
        Receipt $receipt
    ): JsonResponse {
        $data = $request->validate([
            'note' => [
                'required',
                'string',
                'max:5000',
            ],
        ]);

        $note = $receipt->notes()->create([
            'user_id' => $request->user()->id,
            'note' => $data['note'],
        ]);

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'receipt.note_added',
            'auditable_type' => Receipt::class,
            'auditable_id' => $receipt->id,
            'new_values' => [
                'note_id' => $note->id,
            ],
            'description' => 'Organizer added a receipt note.',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'message' => 'Note added successfully.',
            'data' => $note,
        ], 201);
    }

    public function image(
        Receipt $receipt
    ) {
        if (
            !$receipt->receipt_image ||
            !Storage::disk('private')->exists(
                $receipt->receipt_image
            )
        ) {
            return response()->json([
                'message' => 'Receipt image not found.',
            ], 404);
        }

        return Storage::disk('private')->response(
            $receipt->receipt_image
        );
    }
}
