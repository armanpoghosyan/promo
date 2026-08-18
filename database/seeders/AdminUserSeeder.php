<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            [
                'email' => 'admin@example.com',
            ],
            [
                'name' => 'Test Admin',
                'password' => Hash::make('password'),
                'role' => UserRole::ADMIN,
            ]
        );
    }
}
