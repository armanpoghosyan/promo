<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\ReceiptStatus;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Receipt;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ReceiptController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'status' => [
                'nullable',
                Rule::enum(
                    ReceiptStatus::class
                ),
            ],

            'suspicious' => [
                'nullable',
                'boolean',
            ],

            'per_page' => [
                'nullable',
                'integer',
                'min:1',
                'max:100',
            ],
        ]);

        $counts = [
            'all' => Receipt::query()
                ->count(),

            'submitted' => Receipt::query()
                ->where(
                    'status',
                    ReceiptStatus::SUBMITTED
                )
                ->count(),

            'submitted_suspicious' => Receipt::query()
                ->where(
                    'status',
                    ReceiptStatus::SUBMITTED
                )
                ->where(
                    'is_suspicious',
                    true
                )
                ->count(),

            'submitted_normal' => Receipt::query()
                ->where(
                    'status',
                    ReceiptStatus::SUBMITTED
                )
                ->where(
                    'is_suspicious',
                    false
                )
                ->count(),

            'approved' => Receipt::query()
                ->where(
                    'status',
                    ReceiptStatus::APPROVED
                )
                ->count(),

            'rejected' => Receipt::query()
                ->where(
                    'status',
                    ReceiptStatus::REJECTED
                )
                ->count(),
        ];

        $query =
            Receipt::query();

        if (
            ! empty(
                $filters['status']
            )
        ) {
            $query->where(
                'status',
                $filters['status']
            );
        }

        if (
            array_key_exists(
                'suspicious',
                $filters
            )
        ) {
            $query->where(
                'is_suspicious',
                $request->boolean(
                    'suspicious'
                )
            );
        }

        /*
         * Table context:
         *
         * - participant + all receipt summaries
         * - latest note
         * - note history
         * - note count
         *
         * This allows informative table tooltips
         * without additional requests on hover.
         */
        $query
            ->with([
                'participant' => function ($query) {
                    $query
                        ->withCount(
                            'receipts'
                        )
                        ->with([
                            'receipts' => function ($query) {
                                $query
                                    ->select([
                                        'id',
                                        'participant_id',
                                        'receipt_number',
                                        'status',
                                        'is_suspicious',
                                        'suspicious_reasons',
                                        'submitted_at',
                                        'rejection_reason',
                                        'created_at',
                                        'updated_at',
                                    ])
                                    ->latest(
                                        'submitted_at'
                                    );
                            },
                        ]);
                },

                'latestNote.user',

                'notes.user',
            ])
            ->withCount(
                'notes'
            );

        $query
            ->orderByDesc(
                'submitted_at'
            )
            ->orderByDesc(
                'id'
            );

        $perPage =
            $filters['per_page'] ??
            20;

        $paginator =
            $query->paginate(
                $perPage
            );

        return response()->json([
            'data' => $paginator->items(),

            'current_page' => $paginator->currentPage(),

            'last_page' => $paginator->lastPage(),

            'per_page' => $paginator->perPage(),

            'total' => $paginator->total(),

            'from' => $paginator->firstItem(),

            'to' => $paginator->lastItem(),

            'meta' => [
                'counts' => $counts,

                'filters' => [
                    'status' => $filters['status'] ??
                        null,

                    'suspicious' => array_key_exists(
                        'suspicious',
                        $filters
                    )
                            ? $request->boolean(
                                'suspicious'
                            )
                            : null,
                ],
            ],
        ]);
    }

    public function show(
        Receipt $receipt
    ): JsonResponse {
        $this->loadReceiptReviewContext(
            $receipt
        );

        return response()->json([
            'data' => $receipt,
        ]);
    }

    public function approve(
        Request $request,
        Receipt $receipt
    ): JsonResponse {
        $data = $request->validate([
            'review_note' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ]);

        if (
            $receipt->status !==
            ReceiptStatus::SUBMITTED
        ) {
            return response()->json([
                'message' => 'Only submitted receipts can be approved.',
            ], 422);
        }

        $receipt =
            DB::transaction(
                function () use (
                    $request,
                    $receipt,
                    $data
                ) {
                    $receipt =
                        Receipt::query()
                            ->whereKey(
                                $receipt->id
                            )
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

                    $reviewNote = trim(
                        $data['review_note'] ?? ''
                    );

                    if ($receipt->is_suspicious && $reviewNote === '') {
                        throw ValidationException::withMessages([
                            'review_note' => 'A review note is required to approve a suspicious receipt.',
                        ]);
                    }

                    $oldStatus =
                        $receipt
                            ->status
                            ->value;

                    $verifiedAt =
                        now();

                    $receipt->update([
                        'status' => ReceiptStatus::APPROVED,

                        'verified_at' => $verifiedAt,

                        'verified_by' => $request
                            ->user()
                            ->id,

                        'rejection_reason' => null,
                    ]);

                    $reviewNoteId = null;

                    if ($reviewNote !== '') {
                        $note = $receipt->notes()->create([
                            'user_id' => $request->user()->id,
                            'note' => $reviewNote,
                        ]);

                        $reviewNoteId = $note->id;
                    }

                    AuditLog::create([
                        'user_id' => $request
                            ->user()
                            ->id,

                        'action' => 'receipt.approved',

                        'auditable_type' => Receipt::class,

                        'auditable_id' => $receipt->id,

                        'old_values' => [
                            'status' => $oldStatus,
                        ],

                        'new_values' => [
                            'status' => ReceiptStatus::APPROVED
                                ->value,

                            'verified_at' => $verifiedAt
                                ->toISOString(),

                            'verified_by' => $request
                                ->user()
                                ->id,

                            'review_note_id' => $reviewNoteId,
                        ],

                        'description' => 'Receipt approved by organizer.',

                        'ip_address' => $request->ip(),

                        'user_agent' => $request
                            ->userAgent(),
                    ]);

                    return $receipt;
                }
            );

        $this->loadReceiptReviewContext(
            $receipt
        );

        return response()->json([
            'message' => 'Receipt approved successfully.',

            'data' => $receipt,
        ]);
    }

    public function reject(
        Request $request,
        Receipt $receipt
    ): JsonResponse {
        $data =
            $request->validate([
                'reason' => [
                    'required',
                    'string',
                    'max:1000',
                ],
            ]);

        if (
            $receipt->status !==
            ReceiptStatus::SUBMITTED
        ) {
            return response()->json([
                'message' => 'Only submitted receipts can be rejected.',
            ], 422);
        }

        $receipt =
            DB::transaction(
                function () use (
                    $request,
                    $receipt,
                    $data
                ) {
                    $receipt =
                        Receipt::query()
                            ->whereKey(
                                $receipt->id
                            )
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

                    $oldStatus =
                        $receipt
                            ->status
                            ->value;

                    $verifiedAt =
                        now();

                    $receipt->update([
                        'status' => ReceiptStatus::REJECTED,

                        'verified_at' => $verifiedAt,

                        'verified_by' => $request
                            ->user()
                            ->id,

                        'rejection_reason' => $data['reason'],
                    ]);

                    AuditLog::create([
                        'user_id' => $request
                            ->user()
                            ->id,

                        'action' => 'receipt.rejected',

                        'auditable_type' => Receipt::class,

                        'auditable_id' => $receipt->id,

                        'old_values' => [
                            'status' => $oldStatus,
                        ],

                        'new_values' => [
                            'status' => ReceiptStatus::REJECTED
                                ->value,

                            'verified_at' => $verifiedAt
                                ->toISOString(),

                            'verified_by' => $request
                                ->user()
                                ->id,

                            'rejection_reason' => $data['reason'],
                        ],

                        'description' => 'Receipt rejected by organizer.',

                        'ip_address' => $request->ip(),

                        'user_agent' => $request
                            ->userAgent(),
                    ]);

                    return $receipt;
                }
            );

        $this->loadReceiptReviewContext(
            $receipt
        );

        return response()->json([
            'message' => 'Receipt rejected successfully.',

            'data' => $receipt,
        ]);
    }

    public function addNote(
        Request $request,
        Receipt $receipt
    ): JsonResponse {
        $data =
            $request->validate([
                'note' => [
                    'required',
                    'string',
                    'max:5000',
                ],
            ]);

        $note =
            DB::transaction(
                function () use (
                    $request,
                    $receipt,
                    $data
                ) {
                    $note =
                        $receipt
                            ->notes()
                            ->create([
                                'user_id' => $request
                                    ->user()
                                    ->id,

                                'note' => $data['note'],
                            ]);

                    AuditLog::create([
                        'user_id' => $request
                            ->user()
                            ->id,

                        'action' => 'receipt.note_added',

                        'auditable_type' => Receipt::class,

                        'auditable_id' => $receipt->id,

                        'new_values' => [
                            'note_id' => $note->id,
                        ],

                        'description' => 'Organizer added a receipt note.',

                        'ip_address' => $request->ip(),

                        'user_agent' => $request
                            ->userAgent(),
                    ]);

                    return $note;
                }
            );

        $note->load(
            'user'
        );

        return response()->json([
            'message' => 'Note added successfully.',

            'data' => $note,
        ], 201);
    }

    public function image(
        Receipt $receipt
    ) {
        if (
            ! $receipt->receipt_image ||
            ! Storage::disk(
                'private'
            )->exists(
                $receipt->receipt_image
            )
        ) {
            return response()->json([
                'message' => 'Receipt image not found.',
            ], 404);
        }

        return Storage::disk(
            'private'
        )->response(
            $receipt->receipt_image
        );
    }

    private function loadReceiptReviewContext(
        Receipt $receipt
    ): void {
        $receipt->load([
            'participant' => function ($query) {
                $query
                    ->withCount(
                        'receipts'
                    )
                    ->with([
                        'receipts' => function ($query) {
                            $query
                                ->select([
                                    'id',
                                    'participant_id',
                                    'receipt_number',
                                    'status',
                                    'is_suspicious',
                                    'suspicious_reasons',
                                    'submitted_at',
                                    'rejection_reason',
                                    'created_at',
                                    'updated_at',
                                ])
                                ->latest(
                                    'submitted_at'
                                )
                                ->limit(
                                    10
                                );
                        },
                    ]);
            },

            'notes.user',
        ]);

        $duplicateMatches = Receipt::query()
            ->whereKeyNot($receipt->id)
            ->where(function ($query) use ($receipt) {
                $query->where(
                    'receipt_number',
                    $receipt->receipt_number
                );

                if ($receipt->image_hash) {
                    $query->orWhere(
                        'image_hash',
                        $receipt->image_hash
                    );
                }
            })
            ->with([
                'participant:id,first_name,last_name,phone,email',
            ])
            ->latest('submitted_at')
            ->get([
                'id',
                'participant_id',
                'receipt_number',
                'image_hash',
                'status',
                'is_suspicious',
                'submitted_at',
            ])
            ->map(function (Receipt $match) use ($receipt) {
                $matchedBy = [];

                if (
                    mb_strtolower($match->receipt_number) ===
                    mb_strtolower($receipt->receipt_number)
                ) {
                    $matchedBy[] = 'receipt_number';
                }

                if (
                    $receipt->image_hash
                    && $match->image_hash === $receipt->image_hash
                ) {
                    $matchedBy[] = 'receipt_image';
                }

                return [
                    'id' => $match->id,
                    'participant_id' => $match->participant_id,
                    'receipt_number' => $match->receipt_number,
                    'status' => $match->status->value,
                    'is_suspicious' => $match->is_suspicious,
                    'submitted_at' => $match->submitted_at,
                    'matched_by' => $matchedBy,
                    'participant' => $match->participant,
                ];
            })
            ->values();

        $receipt->setAttribute(
            'duplicate_matches',
            $duplicateMatches
        );
    }
}
