<?php

use App\Services\Random\RandomOrgProvider;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Artisan;

Artisan::command('promo:release-check', function (): int {
    $checks = [
        'Application environment is production' => app()->environment('production'),
        'Debug mode is disabled' => config('app.debug') === false,
        'Application key is configured' => filled(config('app.key')),
        'Application URL uses HTTPS' => parse_url((string) config('app.url'), PHP_URL_SCHEME) === 'https',
        'Production database is not SQLite' => config('database.default') !== 'sqlite',
        'Database sessions are enabled' => config('session.driver') === 'database',
        'Session cookies require HTTPS' => config('session.secure') === true,
        'Session cookies are HTTP-only' => config('session.http_only') === true,
        'Session SameSite policy is lax or strict' => in_array(config('session.same_site'), ['lax', 'strict'], true),
        'Demo seed data is disabled' => strtolower((string) config('campaign.seed_dataset')) === 'none',
        'Organizer name is configured' => filled(config('campaign.organizer_name')),
        'Privacy contact email is valid' => filter_var(config('campaign.privacy_contact_email'), FILTER_VALIDATE_EMAIL) !== false,
        'Turnstile is enabled in the frontend' => filter_var(config('campaign.turnstile_enabled'), FILTER_VALIDATE_BOOL),
        'Turnstile site key is configured' => filled(config('services.turnstile.site_key')),
        'Turnstile secret is configured' => filled(config('services.turnstile.secret')),
        'Turnstile hostname is configured' => filled(config('services.turnstile.expected_hostname')),
        'Turnstile action is receipt-submit' => config('services.turnstile.expected_action') === 'receipt-submit',
        'Random.org is the draw provider' => config('services.random.provider') === 'random_org',
        'Random.org API key is configured' => filled(config('services.random_org.api_key')),
    ];

    try {
        $campaignStart = CarbonImmutable::parse((string) config('campaign.start_at'));
        $campaignEnd = CarbonImmutable::parse((string) config('campaign.end_at'));
        $checks['Campaign window is configured and ordered'] = $campaignEnd->isAfter($campaignStart);
    } catch (Throwable) {
        $checks['Campaign window is configured and ordered'] = false;
    }

    foreach ($checks as $label => $passed) {
        $this->line(sprintf('%s %s', $passed ? '[PASS]' : '[FAIL]', $label));
    }

    if (in_array(false, $checks, true)) {
        $this->newLine();
        $this->error('Release configuration is incomplete.');

        return 1;
    }

    $this->newLine();
    $this->info('Release configuration passed.');

    return 0;
})->purpose('Validate required v1 production configuration');

Artisan::command('promo:random-org-smoke', function (RandomOrgProvider $provider): int {
    if (! filled(config('services.random_org.api_key'))) {
        $this->error('RANDOM_ORG_API_KEY is not configured.');

        return 1;
    }

    $input = [101, 202, 303, 404, 505];

    try {
        $result = $provider->shuffle($input);
    } catch (Throwable $exception) {
        $this->error('Random.org smoke test failed: '.$exception->getMessage());

        return 1;
    }
    $expected = $input;
    $actual = $result->values;
    sort($expected);
    sort($actual);

    if ($actual !== $expected || $result->provider !== 'random.org') {
        $this->error('Random.org returned an invalid permutation.');

        return 1;
    }

    $this->info('Random.org smoke test passed.');
    $this->line('Request ID: '.($result->requestId ?? 'not returned'));

    return 0;
})->purpose('Make one real Random.org request and validate the response');
