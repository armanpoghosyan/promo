<?php

namespace App\Services;

use App\Models\Participant;
use App\Models\Receipt;
use Illuminate\Http\UploadedFile;

class DuplicateDetectionService
{
    public function __construct(
        private ParticipantIdentityService $participantIdentity
    ) {}

    public function check(
        string $receiptNumber,
        Participant $participant,
        string $firstName,
        string $lastName,
        string $phoneNormalized,
        string $emailNormalized,
        UploadedFile $image
    ): array {
        $reasons = [];

        $receiptNumber = trim($receiptNumber);

        if ($receiptNumber !== '' && ! preg_match('/^\d+$/', $receiptNumber)) {
            $reasons[] = 'receipt_number_non_numeric';
        }

        if (Receipt::query()->where('receipt_number', $receiptNumber)->exists()) {
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

        if (
            $this->participantIdentity->normalizeName($participant->first_name) !==
                $this->participantIdentity->normalizeName($firstName)
            || $this->participantIdentity->normalizeName($participant->last_name) !==
                $this->participantIdentity->normalizeName($lastName)
        ) {
            $reasons[] = 'participant_name_mismatch';
        }

        $imageHash = hash_file('sha256', $image->getRealPath());

        if (Receipt::query()->where('image_hash', $imageHash)->exists()) {
            $reasons[] = 'duplicate_receipt_image';
        }

        return [
            'is_suspicious' => ! empty($reasons),
            'reasons' => $reasons,
            'image_hash' => $imageHash,
        ];
    }
}
