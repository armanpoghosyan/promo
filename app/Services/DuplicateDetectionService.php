<?php

namespace App\Services;

use App\Models\Participant;
use App\Models\Receipt;
use Illuminate\Http\UploadedFile;

class DuplicateDetectionService
{
    public function check(
        string $receiptNumber,
        Participant $participant,
        string $phoneNormalized,
        string $emailNormalized,
        UploadedFile $image
    ): array {
        $reasons = [];

        if (Receipt::where('receipt_number', trim($receiptNumber))->exists()) {
            $reasons[] = 'duplicate_receipt_number';
        }

        $phoneUsedByAnotherParticipant = Participant::query()
            ->where('phone_normalized', $phoneNormalized)
            ->whereKeyNot($participant->id)
            ->exists();

        if ($phoneUsedByAnotherParticipant) {
            $reasons[] = 'phone_used_by_another_participant';
        }

        $emailUsedByAnotherParticipant = Participant::query()
            ->where('email_normalized', $emailNormalized)
            ->whereKeyNot($participant->id)
            ->exists();

        if ($emailUsedByAnotherParticipant) {
            $reasons[] = 'email_used_by_another_participant';
        }

        $imageHash = hash_file('sha256', $image->getRealPath());

        if (Receipt::where('image_hash', $imageHash)->exists()) {
            $reasons[] = 'duplicate_receipt_image';
        }

        return [
            'is_suspicious' => !empty($reasons),
            'reasons' => $reasons,
            'image_hash' => $imageHash,
        ];
    }
}
