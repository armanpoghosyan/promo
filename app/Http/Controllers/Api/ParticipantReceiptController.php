<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SubmitReceiptRequest;
use App\Services\CampaignWindowService;
use App\Services\ReceiptSubmissionService;
use App\Services\TurnstileService;
use Illuminate\Http\JsonResponse;
use Throwable;

class ParticipantReceiptController extends Controller
{
    public function store(
        SubmitReceiptRequest $request,
        CampaignWindowService $campaignWindow,
        ReceiptSubmissionService $service,
        TurnstileService $turnstile
    ): JsonResponse {
        $campaignStatus = $campaignWindow->submissionStatus();

        if (! $campaignStatus['open']) {
            return response()->json([
                'message' => $campaignStatus['message'],
            ], $campaignStatus['status']);
        }

        try {
            $captchaValid = $turnstile->verify(
                token: $request->string('turnstile_token')->toString(),
                ip: $request->ip()
            );
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'CAPTCHA verification is temporarily unavailable.',
            ], 503);
        }

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
            ],
        ], 201);
    }
}
