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
            ]
        );
    }

    public function normalizePhone(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', trim($phone)) ?? '';

        if (preg_match('/^0(\d{8})$/', $digits, $matches)) {
            return '374'.$matches[1];
        }

        if (preg_match('/^(\d{8})$/', $digits, $matches)) {
            return '374'.$matches[1];
        }

        return $digits;
    }

    public function normalizeEmail(string $email): string
    {
        return mb_strtolower(trim($email));
    }

    public function normalizeName(string $name): string
    {
        $name = preg_replace('/\s+/u', ' ', trim($name)) ?? '';

        return mb_strtolower($name);
    }
}
