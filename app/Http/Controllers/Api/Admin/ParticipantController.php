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
        $query = Participant::query()
            ->withCount('receipts')
            ->latest();

        if ($request->filled('search')) {
            $search = trim(
                $request->string('search')->toString()
            );

            $normalizedPhone = $this->participantIdentity
                ->normalizePhone($search);

            $normalizedEmail = $this->participantIdentity
                ->normalizeEmail($search);

            $query->where(function ($query) use (
                $search,
                $normalizedPhone,
                $normalizedEmail
            ) {
                $query->where(
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

                if ($normalizedPhone !== '') {
                    $query->orWhere(
                        'phone_normalized',
                        'like',
                        "%{$normalizedPhone}%"
                    );
                }

                if ($normalizedEmail !== '') {
                    $query->orWhere(
                        'email_normalized',
                        'like',
                        "%{$normalizedEmail}%"
                    );
                }
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

    public function show(
        Participant $participant
    ): JsonResponse {
        $participant->load('receipts');

        return response()->json([
            'data' => $participant,
        ]);
    }
}
