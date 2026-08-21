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

        $secret = config('services.turnstile.secret');

        if (! is_string($secret) || $secret === '') {
            throw new RuntimeException(
                'CAPTCHA verification is not configured.'
            );
        }

        $response = Http::asForm()
            ->connectTimeout(3)
            ->timeout(8)
            ->retry(2, 200)
            ->post(
                'https://challenges.cloudflare.com/turnstile/v0/siteverify',
                [
                    'secret' => $secret,
                    'response' => $token,
                    'remoteip' => $ip,
                ]
            );

        if (! $response->successful()) {
            throw new RuntimeException(
                'CAPTCHA verification service is unavailable.'
            );
        }

        if ($response->json('success') !== true) {
            return false;
        }

        $expectedHostname = config(
            'services.turnstile.expected_hostname'
        );

        if (
            is_string($expectedHostname)
            && $expectedHostname !== ''
            && $response->json('hostname') !== $expectedHostname
        ) {
            return false;
        }

        $expectedAction = config(
            'services.turnstile.expected_action'
        );

        return ! is_string($expectedAction)
            || $expectedAction === ''
            || $response->json('action') === $expectedAction;
    }
}
