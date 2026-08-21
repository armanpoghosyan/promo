<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $email = env('ADMIN_EMAIL');
        $password = env('ADMIN_PASSWORD');
        $name = env('ADMIN_NAME', 'Promotion Administrator');

        if (app()->environment('production') && (! $email || ! $password)) {
            throw new RuntimeException('ADMIN_EMAIL and ADMIN_PASSWORD are required in production.');
        }

        $email ??= 'admin@example.com';
        $password ??= 'password';

        User::firstOrCreate(
            [
                'email' => $email,
            ],
            [
                'name' => $name,
                'password' => Hash::make($password),
                'role' => UserRole::ADMIN,
            ]
        );
    }
}
