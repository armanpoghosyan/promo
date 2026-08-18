<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class ParticipantFactory extends Factory
{
    public function definition(): array
    {
        $phone = '+374'.fake()->unique()->numerify('########');
        $email = fake()->unique()->safeEmail();

        return [
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'phone' => $phone,
            'phone_normalized' => preg_replace('/\D+/', '', $phone),
            'email' => $email,
            'email_normalized' => strtolower($email),
        ];
    }
}
