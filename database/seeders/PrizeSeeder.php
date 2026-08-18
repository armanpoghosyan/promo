<?php

namespace Database\Seeders;

use App\Models\Prize;
use Illuminate\Database\Seeder;

class PrizeSeeder extends Seeder
{
    public function run(): void
    {
        Prize::create([
            'name' => 'Burn',
            'type' => 'burn',
            'total_quantity' => 500,
        ]);

        Prize::create([
            'name' => 'New Balance Certificate',
            'type' => 'new_balance_gift_card',
            'total_quantity' => 20,
        ]);

        Prize::create([
            'name' => 'Electric Scooter',
            'type' => 'scooter',
            'total_quantity' => 5,
        ]);
    }
}
