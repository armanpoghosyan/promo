<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use InvalidArgumentException;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            AdminUserSeeder::class,
            PrizeSeeder::class,
        ]);

        $dataset = strtolower(
            trim((string) env('SEED_DATASET', 'none'))
        );

        match ($dataset) {
            'none', '' => null,

            'light' => $this->call(
                LightDemoCampaignSeeder::class
            ),

            'full' => $this->call(
                DemoCampaignSeeder::class
            ),

            default => throw new InvalidArgumentException(
                "Unsupported SEED_DATASET [{$dataset}]. Use none, light or full."
            ),
        };
    }
}
