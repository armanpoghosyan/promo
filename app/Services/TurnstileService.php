<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class TurnstileService
{
    public function verify(
        string $token,
        ?string $ip = null
    ): bool {
        if (app()->environment('local')) {
            return true;
        }

        $response = Http::asForm()->post(
            'https://challenges.cloudflare.com/turnstile/v0/siteverify',
            [
                'secret' => config('services.turnstile.secret'),
                'response' => $token,
                'remoteip' => $ip,
            ]
        );

        if (! $response->successful()) {
            throw new RuntimeException(
                'CAPTCHA verification service is unavailable.'
            );
        }

        return $response->json('success') === true;
    }
}
