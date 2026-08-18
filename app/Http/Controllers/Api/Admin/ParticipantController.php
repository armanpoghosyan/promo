<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Participant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ParticipantController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Participant::query()
            ->withCount('receipts')
            ->latest();

        if ($request->filled('search')) {
            $search = trim($request->string('search')->toString());
            $normalizedPhone = preg_replace('/\D+/', '', $search) ?? '';
            $normalizedEmail = strtolower($search);

            if (str_starts_with($normalizedPhone, '0')) {
                $normalizedPhone = substr($normalizedPhone, 1);
            }

            $query->where(function ($q) use (
                $search,
                $normalizedPhone,
                $normalizedEmail
            ) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");

                if ($normalizedPhone !== '') {
                    $q->orWhere(
                        'phone_normalized',
                        'like',
                        "%{$normalizedPhone}%"
                    );
                }

                if ($normalizedEmail !== '') {
                    $q->orWhere(
                        'email_normalized',
                        'like',
                        "%{$normalizedEmail}%"
                    );
                }
            });
        }

        $participants = $query->paginate(
            $request->integer('per_page', 20)
        );

        return response()->json($participants);
    }

    public function show(Participant $participant): JsonResponse
    {
        $participant->load('receipts');

        return response()->json([
            'data' => $participant,
        ]);
    }
}
