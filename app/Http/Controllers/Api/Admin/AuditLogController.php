<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Draw;
use App\Models\DrawWinner;
use App\Models\Receipt;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'category' => [
                'nullable',
                'string',
                Rule::in([
                    'all',
                    'receipts',
                    'draws',
                    'winners',
                    'reports',
                ]),
            ],

            'action' => [
                'nullable',
                'string',
                'max:255',
            ],

            'user_id' => [
                'nullable',
                'integer',
            ],

            'auditable_type' => [
                'nullable',
                'string',
                'max:255',
            ],

            'auditable_id' => [
                'nullable',
                'integer',
            ],

            'date_from' => [
                'nullable',
                'date',
            ],

            'date_to' => [
                'nullable',
                'date',
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
            strtotime($filters['date_to']) <
            strtotime($filters['date_from'])
        ) {
            return response()->json([
                'message' =>
                    'The date to must be after or equal to date from.',

                'errors' => [
                    'date_to' => [
                        'The date to must be after or equal to date from.',
                    ],
                ],
            ], 422);
        }

        $query = AuditLog::query()
            ->with('user')
            ->latest();

        /*
         * High-level Activity Log category.
         */
        $category =
            $filters['category'] ??
            'all';

        match ($category) {
            'receipts' => $query->where(
                'auditable_type',
                Receipt::class
            ),

            'draws' => $query->where(
                'auditable_type',
                Draw::class
            ),

            'winners' => $query->where(
                'auditable_type',
                DrawWinner::class
            ),

            'reports' => $query->where(
                'action',
                'like',
                'report.%'
            ),

            default => null,
        };

        /*
         * Existing technical filters.
         */
        if (! empty($filters['action'])) {
            $query->where(
                'action',
                $filters['action']
            );
        }

        if (! empty($filters['user_id'])) {
            $query->where(
                'user_id',
                $filters['user_id']
            );
        }

        if (! empty($filters['auditable_type'])) {
            $query->where(
                'auditable_type',
                $this->resolveAuditableType(
                    $filters['auditable_type']
                )
            );
        }

        if (! empty($filters['auditable_id'])) {
            $query->where(
                'auditable_id',
                $filters['auditable_id']
            );
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate(
                'created_at',
                '>=',
                $filters['date_from']
            );
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate(
                'created_at',
                '<=',
                $filters['date_to']
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

    private function resolveAuditableType(
        string $type
    ): string {
        return match (
            strtolower(
                trim($type)
            )
        ) {
            'receipt' =>
                Receipt::class,

            'draw' =>
                Draw::class,

            'winner',
            'draw_winner' =>
                DrawWinner::class,

            'user' =>
                User::class,

            default =>
                $type,
        };
    }
}
