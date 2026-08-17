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
            $search = $request->string('search')->toString();

            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
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
