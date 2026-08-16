<?php

namespace App\Services;

use App\Models\Participant;

class ParticipantIdentityService
{
    public function resolve(array $data): Participant
    {
        $phoneNormalized = $this->normalizePhone($data['phone']);
        $emailNormalized = $this->normalizeEmail($data['email']);

        return Participant::firstOrCreate(
            [
                'phone_normalized' => $phoneNormalized,
                'email_normalized' => $emailNormalized,
            ],
            [
                'first_name' => trim($data['first_name']),
                'last_name' => trim($data['last_name']),
                'phone' => trim($data['phone']),
                'email' => trim($data['email']),
                'privacy_policy_accepted_at' => now(),
                'official_rules_accepted_at' => now(),
                'personal_data_consent_at' => now(),
            ]
        );
    }

    public function normalizePhone(string $phone): string
    {
        return preg_replace('/\D+/', '', trim($phone)) ?? '';
    }

    public function normalizeEmail(string $email): string
    {
        return mb_strtolower(trim($email));
    }
}
