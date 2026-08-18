<?php

namespace App\Services\Random;

class RandomResult
{
    public function __construct(
        public readonly array $values,
        public readonly string $provider,
        public readonly ?string $requestId = null,
        public readonly ?array $request = null,
        public readonly ?array $response = null
    ) {}
}
