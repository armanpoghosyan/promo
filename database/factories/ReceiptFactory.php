<?php

namespace Database\Factories;

use App\Enums\ReceiptStatus;
use App\Models\Participant;
use Illuminate\Database\Eloquent\Factories\Factory;

class ReceiptFactory extends Factory
{
    public function definition(): array
    {
        return [
            'participant_id' => Participant::factory(),

            'receipt_number' => fake()->unique()->numerify('##########'),

            'receipt_image' => 'receipts/test.jpg',

            'status' => ReceiptStatus::SUBMITTED,

            'submitted_at' => now(),

            'verified_at' => null,

            'verified_by' => null,

            'rejection_reason' => null,

            'notes' => null,
        ];
    }
}
