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
            'value' => null,
            'currency' => null,
            'total_quantity' => 500,
        ]);

        Prize::create([
            'name' => 'New Balance Gift Card',
            'type' => 'new_balance_gift_card',
            'value' => 40000,
            'currency' => 'AMD',
            'total_quantity' => 30,
        ]);

        Prize::create([
            'name' => 'Scooter',
            'type' => 'scooter',
            'value' => null,
            'currency' => null,
            'total_quantity' => 5,
        ]);
    }
}
