<?php

namespace Database\Factories;

use App\Enums\ReceiptStatus;
use App\Models\Participant;
use Illuminate\Database\Eloquent\Factories\Factory;

class ReceiptFactory extends Factory
{
    public function definition(): array
    {
        $submittedAt = now();

        return [
            'participant_id' => Participant::factory(),
            'receipt_number' => fake()->unique()->numerify('##########'),
            'receipt_image' => 'receipts/test.jpg',
            'image_hash' => fake()->sha256(),
            'status' => ReceiptStatus::SUBMITTED,
            'is_suspicious' => false,
            'suspicious_reasons' => null,
            'submitted_at' => $submittedAt,
            'privacy_policy_accepted_at' => $submittedAt,
            'official_rules_accepted_at' => $submittedAt,
            'personal_data_consent_at' => $submittedAt,
            'verified_at' => null,
            'verified_by' => null,
            'rejection_reason' => null,
        ];
    }
}
