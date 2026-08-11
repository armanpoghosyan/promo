<?php

namespace App\Services;

use App\Enums\ReceiptStatus;
use App\Models\Participant;
use App\Models\Receipt;
use App\Models\AuditLog;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class ReceiptSubmissionService
{
    public function __construct(
        private DuplicateDetectionService $duplicateDetector
    ) {
    }

    public function submit(
        array $participantData,
        string $receiptNumber,
        UploadedFile $receiptImage
    ): Receipt {
        return DB::transaction(function () use (
            $participantData,
            $receiptNumber,
            $receiptImage
        ) {
            $duplicateCheck = $this->duplicateDetector->check(
                receiptNumber: $receiptNumber,
                phone: $participantData['phone'],
                email: $participantData['email'],
                image: $receiptImage,
            );

            $participant = Participant::create([
                ...$participantData,
                'privacy_policy_accepted_at' => now(),
                'official_rules_accepted_at' => now(),
                'personal_data_consent_at' => now(),
            ]);

            $path = $receiptImage->store(
                'receipts',
                'private'
            );

            $receipt = Receipt::create([
                'participant_id' => $participant->id,
                'receipt_number' => $receiptNumber,
                'receipt_image' => $path,
                'image_hash' => $duplicateCheck['image_hash'],
                'status' => ReceiptStatus::SUBMITTED,
                'is_suspicious' => $duplicateCheck['is_suspicious'],
                'suspicious_reasons' => $duplicateCheck['reasons'],
                'submitted_at' => now(),
            ]);

            AuditLog::create([
               'user_id' => null,
               'action' => 'receipt.submitted',
               'auditable_type' => Receipt::class,
               'auditable_id' => $receipt->id,
               'old_values' => null,
               'new_values' => [
                   'status' => ReceiptStatus::SUBMITTED->value,
                   'is_suspicious' => $receipt->is_suspicious,
               ],
               'description' => 'Participant submitted a receipt.',
               'ip_address' => request()->ip(),
               'user_agent' => request()->userAgent(),
           ]);

           return $receipt;
        });
    }
}
