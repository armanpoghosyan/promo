<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\ReceiptStatus;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Receipt;
use App\Services\ParticipantIdentityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ReceiptController extends Controller
{
    public function __construct(
        private ParticipantIdentityService $participantIdentity
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'date_from' => [
                'nullable',
                'date',
            ],
            'date_to' => [
                'nullable',
                'date',
            ],
        ]);

        if (
            !empty($filters['date_from']) &&
            !empty($filters['date_to']) &&
            strtotime($filters['date_to']) <
            strtotime($filters['date_from'])
        ) {
            return response()->json([
                'message' => 'The date to must be after or equal to date from.',
                'errors' => [
                    'date_to' => [
                        'The date to must be after or equal to date from.',
                    ],
                ],
            ], 422);
        }

        $query = Receipt::query()
            ->with('participant');

        if ($request->filled('status')) {
            $query->where(
                'status',
                $request->string('status')->toString()
            );
        }

        if ($request->filled('receipt_number')) {
            $receiptNumber = $request
                ->string('receipt_number')
                ->toString();

            $query->where(
                'receipt_number',
                'like',
                '%' . $receiptNumber . '%'
            );
        }

        if ($request->filled('phone')) {
            $phone = trim(
                $request->string('phone')->toString()
            );

            $normalizedPhone = $this->participantIdentity
                ->normalizePhone($phone);

            $query->whereHas(
                'participant',
                function ($query) use (
                    $phone,
                    $normalizedPhone
                ) {
                    $query->where(function ($query) use (
                        $phone,
                        $normalizedPhone
                    ) {
                        $query->where(
                            'phone',
                            'like',
                            '%' . $phone . '%'
                        );

                        if ($normalizedPhone !== '') {
                            $query->orWhere(
                                'phone_normalized',
                                'like',
                                '%' . $normalizedPhone . '%'
                            );
                        }
                    });
                }
            );
        }

        if ($request->filled('email')) {
            $email = trim(
                $request->string('email')->toString()
            );

            $normalizedEmail = $this->participantIdentity
                ->normalizeEmail($email);

            $query->whereHas(
                'participant',
                function ($query) use (
                    $email,
                    $normalizedEmail
                ) {
                    $query->where(function ($query) use (
                        $email,
                        $normalizedEmail
                    ) {
                        $query->where(
                            'email',
                            'like',
                            '%' . $email . '%'
                        )
                            ->orWhere(
                                'email_normalized',
                                'like',
                                '%' . $normalizedEmail . '%'
                            );
                    });
                }
            );
        }

        if ($request->boolean('suspicious')) {
            $query->where(
                'is_suspicious',
                true
            );
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate(
                'submitted_at',
                '>=',
                $filters['date_from']
            );
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate(
                'submitted_at',
                '<=',
                $filters['date_to']
            );
        }

        $perPage = min(
            max($request->integer('per_page', 20), 1),
            100
        );

        return response()->json(
            $query
                ->latest()
                ->paginate($perPage)
        );
    }

    public function show(Receipt $receipt): JsonResponse
    {
        $receipt->load([
            'participant',
            'notes.user',
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

        $receipt = DB::transaction(
            function () use ($request, $receipt) {
                $receipt = Receipt::query()
                    ->whereKey($receipt->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if (
                    $receipt->status !==
                    ReceiptStatus::SUBMITTED
                ) {
                    abort(
                        422,
                        'Only submitted receipts can be approved.'
                    );
                }

                $oldStatus = $receipt->status->value;
                $verifiedAt = now();

                $receipt->update([
                    'status' => ReceiptStatus::APPROVED,
                    'verified_at' => $verifiedAt,
                    'verified_by' => $request->user()->id,
                    'rejection_reason' => null,
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
                        'status' =>
                            ReceiptStatus::APPROVED->value,
                        'verified_at' =>
                            $verifiedAt->toISOString(),
                        'verified_by' =>
                            $request->user()->id,
                    ],
                    'description' =>
                        'Receipt approved by organizer.',
                    'ip_address' => $request->ip(),
                    'user_agent' =>
                        $request->userAgent(),
                ]);

                return $receipt;
            }
        );

        $receipt->load([
            'participant',
            'notes.user',
        ]);

        return response()->json([
            'message' => 'Receipt approved successfully.',
            'data' => $receipt,
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

        if ($receipt->status !== ReceiptStatus::SUBMITTED) {
            return response()->json([
                'message' => 'Only submitted receipts can be rejected.',
            ], 422);
        }

        $receipt = DB::transaction(
            function () use (
                $request,
                $receipt,
                $data
            ) {
                $receipt = Receipt::query()
                    ->whereKey($receipt->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if (
                    $receipt->status !==
                    ReceiptStatus::SUBMITTED
                ) {
                    abort(
                        422,
                        'Only submitted receipts can be rejected.'
                    );
                }

                $oldStatus = $receipt->status->value;
                $verifiedAt = now();

                $receipt->update([
                    'status' => ReceiptStatus::REJECTED,
                    'verified_at' => $verifiedAt,
                    'verified_by' => $request->user()->id,
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
                        'status' =>
                            ReceiptStatus::REJECTED->value,
                        'verified_at' =>
                            $verifiedAt->toISOString(),
                        'verified_by' =>
                            $request->user()->id,
                        'rejection_reason' =>
                            $data['reason'],
                    ],
                    'description' =>
                        'Receipt rejected by organizer.',
                    'ip_address' => $request->ip(),
                    'user_agent' =>
                        $request->userAgent(),
                ]);

                return $receipt;
            }
        );

        $receipt->load([
            'participant',
            'notes.user',
        ]);

        return response()->json([
            'message' => 'Receipt rejected successfully.',
            'data' => $receipt,
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

        $note = DB::transaction(
            function () use (
                $request,
                $receipt,
                $data
            ) {
                $note = $receipt->notes()->create([
                    'user_id' => $request->user()->id,
                    'note' => $data['note'],
                ]);

                AuditLog::create([
                    'user_id' =>
                        $request->user()->id,
                    'action' =>
                        'receipt.note_added',
                    'auditable_type' =>
                        Receipt::class,
                    'auditable_id' =>
                        $receipt->id,
                    'new_values' => [
                        'note_id' => $note->id,
                    ],
                    'description' =>
                        'Organizer added a receipt note.',
                    'ip_address' =>
                        $request->ip(),
                    'user_agent' =>
                        $request->userAgent(),
                ]);

                return $note;
            }
        );

        $note->load('user');

        return response()->json([
            'message' => 'Note added successfully.',
            'data' => $note,
        ], 201);
    }

    public function image(Receipt $receipt)
    {
        if (
            !$receipt->receipt_image ||
            !Storage::disk('private')
                ->exists($receipt->receipt_image)
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
