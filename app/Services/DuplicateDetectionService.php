<?php

namespace App\Services;

use App\Models\Participant;
use App\Models\Receipt;
use Illuminate\Http\UploadedFile;

class DuplicateDetectionService
{
    public function check(
        string $receiptNumber,
        string $phone,
        string $email,
        UploadedFile $image
    ): array {
        $reasons = [];

        if (
            Receipt::where(
                'receipt_number',
                $receiptNumber
            )->exists()
        ) {
            $reasons[] = 'duplicate_receipt_number';
        }

        if (
            Participant::where(
                'phone',
                $phone
            )->exists()
        ) {
            $reasons[] = 'existing_phone';
        }

        if (
            Participant::where(
                'email',
                $email
            )->exists()
        ) {
            $reasons[] = 'existing_email';
        }

        $imageHash = hash_file(
            'sha256',
            $image->getRealPath()
        );

        if (
            Receipt::where(
                'image_hash',
                $imageHash
            )->exists()
        ) {
            $reasons[] = 'duplicate_receipt_image';
        }

        return [
            'is_suspicious' => count($reasons) > 0,
            'reasons' => $reasons,
            'image_hash' => $imageHash,
        ];
    }
}
