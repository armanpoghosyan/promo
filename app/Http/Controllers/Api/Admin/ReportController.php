<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use Illuminate\Http\JsonResponse;

class ReportController extends Controller
{
    public function __construct(
        private ReportService $reportService
    ) {}

    public function overview(): JsonResponse
    {
        return response()->json([
            'data' => [
                'overview' => $this->reportService->overview(),
                'draws' => $this->reportService->draws(),
                'prize_allocation' => $this->reportService->prizeAllocation(),
            ],
        ]);
    }
}
