<?php

return [
    'start_at' => env('CAMPAIGN_START_AT'),
    'end_at' => env('CAMPAIGN_END_AT'),
    'seed_dataset' => env('SEED_DATASET', 'none'),
    'organizer_name' => env('VITE_ORGANIZER_NAME'),
    'privacy_contact_email' => env('VITE_PRIVACY_CONTACT_EMAIL'),
    'turnstile_enabled' => env('VITE_TURNSTILE_ENABLED', false),
];
