<?php

namespace App\Services;

use App\Enums\ReceiptStatus;
use App\Models\AuditLog;
use App\Models\Receipt;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class ReceiptSubmissionService
{
    public function __construct(
        private DuplicateDetectionService $duplicateDetector,
        private ParticipantIdentityService $participantIdentity
    ) {}

    public function submit(
        array $participantData,
        string $receiptNumber,
        UploadedFile $receiptImage,
        ?string $ipAddress = null,
        ?string $userAgent = null
    ): Receipt {
        $path = null;

        try {
            return DB::transaction(function () use (
                $participantData,
                $receiptNumber,
                $receiptImage,
                $ipAddress,
                $userAgent,
                &$path
            ) {
                $phoneNormalized = $this->participantIdentity
                    ->normalizePhone($participantData['phone']);

                $emailNormalized = $this->participantIdentity
                    ->normalizeEmail($participantData['email']);

                $participant = $this->participantIdentity
                    ->resolve($participantData);

                $duplicateCheck = $this->duplicateDetector->check(
                    receiptNumber: $receiptNumber,
                    participant: $participant,
                    phoneNormalized: $phoneNormalized,
                    emailNormalized: $emailNormalized,
                    image: $receiptImage
                );

                $path = $receiptImage->store('receipts', 'private');
                $submittedAt = now();

                $receipt = Receipt::create([
                    'participant_id' => $participant->id,
                    'receipt_number' => trim($receiptNumber),
                    'receipt_image' => $path,
                    'image_hash' => $duplicateCheck['image_hash'],
                    'status' => ReceiptStatus::SUBMITTED,
                    'is_suspicious' => $duplicateCheck['is_suspicious'],
                    'suspicious_reasons' => $duplicateCheck['reasons'],
                    'submitted_at' => $submittedAt,
                    'privacy_policy_accepted_at' => $submittedAt,
                    'official_rules_accepted_at' => $submittedAt,
                    'personal_data_consent_at' => $submittedAt,
                ]);

                AuditLog::create([
                    'user_id' => null,
                    'action' => 'receipt.submitted',
                    'auditable_type' => Receipt::class,
                    'auditable_id' => $receipt->id,
                    'old_values' => null,
                    'new_values' => [
                        'participant_id' => $participant->id,
                        'status' => ReceiptStatus::SUBMITTED->value,
                        'is_suspicious' => $receipt->is_suspicious,
                        'privacy_policy_accepted_at' => $submittedAt->toISOString(),
                        'official_rules_accepted_at' => $submittedAt->toISOString(),
                        'personal_data_consent_at' => $submittedAt->toISOString(),
                    ],
                    'description' => 'Participant submitted a receipt.',
                    'ip_address' => $ipAddress,
                    'user_agent' => $userAgent,
                ]);

                return $receipt;
            });
        } catch (Throwable $e) {
            if ($path) {
                Storage::disk('private')->delete($path);
            }

            throw $e;
        }
    }
}
