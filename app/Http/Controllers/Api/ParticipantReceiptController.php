<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SubmitReceiptRequest;
use App\Services\ReceiptSubmissionService;
use App\Services\TurnstileService;
use Illuminate\Http\JsonResponse;

class ParticipantReceiptController extends Controller
{
    public function store(
        SubmitReceiptRequest $request,
        ReceiptSubmissionService $service,
        TurnstileService $turnstile
    ): JsonResponse {
        $captchaValid = $turnstile->verify(
            token: $request->string('turnstile_token')->toString(),
            ip: $request->ip()
        );

        if (! $captchaValid) {
            return response()->json([
                'message' => 'CAPTCHA verification failed.',
            ], 422);
        }

        $receipt = $service->submit(
            participantData: $request->only([
                'first_name',
                'last_name',
                'phone',
                'email',
            ]),
            receiptNumber: $request->string('receipt_number')->toString(),
            receiptImage: $request->file('receipt_image'),
            ipAddress: $request->ip(),
            userAgent: $request->userAgent()
        );

        return response()->json([
            'message' => 'Your participation request has been submitted successfully.',
            'data' => [
                'receipt_id' => $receipt->id,
                'receipt_number' => $receipt->receipt_number,
                'status' => $receipt->status->value,
                'submitted_at' => $receipt->submitted_at,
                'is_suspicious' => $receipt->is_suspicious,
            ],
        ], 201);
    }
}
