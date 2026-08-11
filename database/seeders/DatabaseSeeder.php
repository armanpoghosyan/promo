<?php

namespace Database\Seeders;

use App\Enums\ReceiptStatus;
use App\Models\Participant;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            PrizeSeeder::class,
            DrawSeeder::class,
        ]);

        Participant::factory()
            ->count(10)
            ->create()
            ->each(function (Participant $participant) {
                $participant->receipts()->createMany([
                    [
                        'receipt_number' => fake()->unique()->numerify('##########'),
                        'receipt_image' => 'receipts/test.jpg',
                        'status' => ReceiptStatus::SUBMITTED,
                        'submitted_at' => now(),
                    ],
                    [
                        'receipt_number' => fake()->unique()->numerify('##########'),
                        'receipt_image' => 'receipts/test.jpg',
                        'status' => ReceiptStatus::APPROVED,
                        'submitted_at' => now(),
                        'verified_at' => now(),
                    ],
                ]);
            });
    }
}
