<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\ReceiptStatus;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Receipt;
use App\Services\ParticipantIdentityService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ReceiptController extends Controller
{
    public function __construct(
        private ParticipantIdentityService $participantIdentity
    ) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => [
                'nullable',
                'string',
                'max:255',
            ],

            'status' => [
                'nullable',
                Rule::enum(ReceiptStatus::class),
            ],

            'suspicious' => [
                'nullable',
                'boolean',
            ],

            'suspicious_reason' => [
                'nullable',
                'string',
                'max:100',
            ],

            'date_from' => [
                'nullable',
                'date',
            ],

            'date_to' => [
                'nullable',
                'date',
            ],

            'direction' => [
                'nullable',
                Rule::in([
                    'asc',
                    'desc',
                ]),
            ],

            'per_page' => [
                'nullable',
                'integer',
                'min:1',
                'max:100',
            ],
        ]);

        if (
            ! empty($filters['date_from']) &&
            ! empty($filters['date_to']) &&
            strtotime($filters['date_to']) < strtotime($filters['date_from'])
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

        $baseQuery = Receipt::query();

        $this->applySearch(
            $baseQuery,
            $filters['search'] ?? null
        );

        $this->applyDateFilters(
            $baseQuery,
            $filters['date_from'] ?? null,
            $filters['date_to'] ?? null
        );

        $this->applySuspiciousReasonFilter(
            $baseQuery,
            $filters['suspicious_reason'] ?? null
        );

        /*
         * Counts used by frontend navigation:
         *
         * All 1000
         * Needs Review 240
         * Approved 700
         * Rejected 60
         * Suspicious 34
         *
         * Search/date/reason filters affect these
         * counts, while the currently selected
         * status tab does not.
         */
        $counts = [
            'all' => (clone $baseQuery)
                ->count(),

            'submitted' => (clone $baseQuery)
                ->where(
                    'status',
                    ReceiptStatus::SUBMITTED
                )
                ->count(),

            'approved' => (clone $baseQuery)
                ->where(
                    'status',
                    ReceiptStatus::APPROVED
                )
                ->count(),

            'rejected' => (clone $baseQuery)
                ->where(
                    'status',
                    ReceiptStatus::REJECTED
                )
                ->count(),

            'suspicious' => (clone $baseQuery)
                ->where(
                    'is_suspicious',
                    true
                )
                ->count(),
        ];

        /*
         * Query for the actual selected table.
         */
        $query =
            clone $baseQuery;

        if (
            ! empty($filters['status'])
        ) {
            $query->where(
                'status',
                $filters['status']
            );
        }

        if (
            $request->boolean(
                'suspicious'
            )
        ) {
            $query->where(
                'is_suspicious',
                true
            );
        }

        /*
         * List-only information.
         *
         * participant.receipts_count
         * lets frontend calculate:
         *
         * +5 other receipts
         *
         * notes_count + latest_note give:
         *
         * Need to contact manager... +2
         *
         * without loading all notes.
         */
        $query
            ->with([
                'participant' => function ($query) {
                    $query->withCount(
                        'receipts'
                    );
                },

                'latestNote.user',
            ])
            ->withCount(
                'notes'
            );

        /*
         * Receipt table currently sorts only
         * by submitted date.
         *
         * Default:
         * newest submissions first.
         */
        $direction =
            $filters['direction'] ??
            'desc';

        $query
            ->orderBy(
                'submitted_at',
                $direction
            )
            ->orderBy(
                'id',
                $direction
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
                    'search' => $filters['search'] ??
                        null,

                    'status' => $filters['status'] ??
                        null,

                    'suspicious' => $request->boolean(
                        'suspicious'
                    ),

                    'suspicious_reason' => $filters[
                            'suspicious_reason'
                        ] ?? null,

                    'date_from' => $filters[
                            'date_from'
                        ] ?? null,

                    'date_to' => $filters[
                            'date_to'
                        ] ?? null,

                    'direction' => $direction,
                ],
            ],
        ]);
    }

    private function applySearch(
        Builder $query,
        ?string $search
    ): void {
        $search =
            trim(
                (string) $search
            );

        if ($search === '') {
            return;
        }

        $like =
            '%'.$search.'%';

        $normalizedPhone =
            $this
                ->participantIdentity
                ->normalizePhone(
                    $search
                );

        $normalizedEmail =
            $this
                ->participantIdentity
                ->normalizeEmail(
                    $search
                );

        $query->where(
            function (
                Builder $query
            ) use (
                $search,
                $like,
                $normalizedPhone,
                $normalizedEmail
            ) {
                /*
                 * Receipt ID is an exact match.
                 */
                if (
                    ctype_digit(
                        $search
                    )
                ) {
                    $query->orWhere(
                        'id',
                        (int) $search
                    );
                }

                /*
                 * Receipt number is partial.
                 */
                $query->orWhere(
                    'receipt_number',
                    'like',
                    $like
                );

                /*
                 * Participant fields are all
                 * searched as one OR group.
                 */
                $query->orWhereHas(
                    'participant',
                    function (
                        Builder $query
                    ) use (
                        $like,
                        $normalizedPhone,
                        $normalizedEmail
                    ) {
                        $query
                            ->where(
                                'first_name',
                                'like',
                                $like
                            )
                            ->orWhere(
                                'last_name',
                                'like',
                                $like
                            )
                            ->orWhere(
                                'phone',
                                'like',
                                $like
                            )
                            ->orWhere(
                                'email',
                                'like',
                                $like
                            );

                        if (
                            $normalizedPhone !==
                            ''
                        ) {
                            $query->orWhere(
                                'phone_normalized',
                                'like',
                                '%'.
                                    $normalizedPhone.
                                    '%'
                            );
                        }

                        if (
                            $normalizedEmail !==
                            ''
                        ) {
                            $query->orWhere(
                                'email_normalized',
                                'like',
                                '%'.
                                    $normalizedEmail.
                                    '%'
                            );
                        }
                    }
                );
            }
        );
    }

    private function applyDateFilters(
        Builder $query,
        ?string $dateFrom,
        ?string $dateTo
    ): void {
        if ($dateFrom) {
            $query->whereDate(
                'submitted_at',
                '>=',
                $dateFrom
            );
        }

        if ($dateTo) {
            $query->whereDate(
                'submitted_at',
                '<=',
                $dateTo
            );
        }
    }

    private function applySuspiciousReasonFilter(
        Builder $query,
        ?string $reason
    ): void {
        $reason =
            trim(
                (string) $reason
            );

        if ($reason === '') {
            return;
        }

        $query->whereJsonContains('suspicious_reasons', $reason
        );
    }

    public function show(Receipt $receipt): JsonResponse
    {
        $receipt->load([
            'participant' => function ($query) {
                $query->withCount('receipts');
            },

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
                        'status' => ReceiptStatus::APPROVED->value,
                        'verified_at' => $verifiedAt->toISOString(),
                        'verified_by' => $request->user()->id,
                    ],
                    'description' => 'Receipt approved by organizer.',
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);

                return $receipt;
            }
        );

        $receipt->load([
            'participant' => function ($query) {
                $query->withCount('receipts');
            },

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
                        'status' => ReceiptStatus::REJECTED->value,
                        'verified_at' => $verifiedAt->toISOString(),
                        'verified_by' => $request->user()->id,
                        'rejection_reason' => $data['reason'],
                    ],
                    'description' => 'Receipt rejected by organizer.',
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);

                return $receipt;
            }
        );

        $receipt->load([
            'participant' => function ($query) {
                $query->withCount('receipts');
            },

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
            ! $receipt->receipt_image ||
            ! Storage::disk('private')
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
