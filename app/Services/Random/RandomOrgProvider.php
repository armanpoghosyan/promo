<?php

namespace App\Services\Random;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class RandomOrgProvider implements RandomProvider
{
    public function shuffle(array $values): RandomResult
    {
        $values = array_values($values);

        if (empty($values)) {
            return new RandomResult(
                values: [],
                provider: 'random.org',
                request: [
                    'entries' => [],
                ],
                response: [
                    'values' => [],
                ]
            );
        }

        $apiKey = config('services.random_org.api_key');

        if (! $apiKey) {
            throw new RuntimeException(
                'Random.org API key is not configured.'
            );
        }

        $count = count($values);
        $requestId = (string) Str::uuid();

        $request = [
            'jsonrpc' => '2.0',
            'method' => 'generateIntegers',
            'params' => [
                'n' => $count,
                'min' => 0,
                'max' => $count - 1,
                'replacement' => false,
            ],
            'id' => $requestId,
        ];

        $apiRequest = $request;

        $apiRequest['params']['apiKey'] = $apiKey;

        $response = Http::timeout(30)
            ->post(
                'https://api.random.org/json-rpc/4/invoke',
                $apiRequest
            );

        if (! $response->successful()) {
            throw new RuntimeException(
                'Random.org request failed.'
            );
        }

        $body = $response->json();

        if (isset($body['error'])) {
            throw new RuntimeException(
                $body['error']['message']
                    ?? 'Random.org returned an error.'
            );
        }

        $randomIndexes =
            $body['result']['random']['data']
            ?? null;

        if (! is_array($randomIndexes)) {
            throw new RuntimeException(
                'Invalid response from Random.org.'
            );
        }

        if (count($randomIndexes) !== $count) {
            throw new RuntimeException(
                'Random.org returned an invalid number of values.'
            );
        }

        $shuffled = [];

        foreach ($randomIndexes as $index) {
            if (! array_key_exists($index, $values)) {
                throw new RuntimeException(
                    'Random.org returned an invalid index.'
                );
            }

            $shuffled[] = $values[$index];
        }

        return new RandomResult(
            values: $shuffled,
            provider: 'random.org',
            requestId: $requestId,
            request: [
                ...$request,
                'entries' => $values,
            ],
            response: [
                'provider_response' => $body,
                'values' => $shuffled,
            ]
        );
    }
}
