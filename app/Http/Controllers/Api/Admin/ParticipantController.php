<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Participant;
use App\Services\ParticipantIdentityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ParticipantController extends Controller
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
                'max:100',
            ],

            'per_page' => [
                'nullable',
                'integer',
                'min:1',
                'max:100',
            ],
        ]);

        $query = Participant::query()
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
            ])
            ->latest();

        if (
            ! empty(
                $filters['search']
            )
        ) {
            $search = trim(
                $filters['search']
            );

            $normalizedPhone =
                $this->participantIdentity
                    ->normalizePhone(
                        $search
                    );

            $normalizedEmail =
                $this->participantIdentity
                    ->normalizeEmail(
                        $search
                    );

            $query->where(
                function ($query) use (
                    $search,
                    $normalizedPhone,
                    $normalizedEmail
                ) {
                    $query
                        ->where(
                            'first_name',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'last_name',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'phone',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'email',
                            'like',
                            "%{$search}%"
                        );

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

                    if (
                        $normalizedPhone !==
                        ''
                    ) {
                        $query->orWhere(
                            'phone_normalized',
                            'like',
                            "%{$normalizedPhone}%"
                        );
                    }

                    if (
                        $normalizedEmail !==
                        ''
                    ) {
                        $query->orWhere(
                            'email_normalized',
                            'like',
                            "%{$normalizedEmail}%"
                        );
                    }
                }
            );
        }

        $perPage =
            $filters['per_page'] ??
            20;

        return response()->json(
            $query->paginate(
                $perPage
            )
        );
    }

    public function show(
        Participant $participant
    ): JsonResponse {
        $participant->load(
            'receipts'
        );

        return response()->json([
            'data' =>
                $participant,
        ]);
    }
}
