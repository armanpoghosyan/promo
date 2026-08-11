<?php

namespace Database\Seeders;

use App\Models\Draw;
use Illuminate\Database\Seeder;

class DrawSeeder extends Seeder
{
    public function run(): void
    {
        for ($week = 1; $week <= 5; $week++) {
            Draw::create([
                'week_number' => $week,
                'status' => 'scheduled',
            ]);
        }
    }
}
