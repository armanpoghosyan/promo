<?php

namespace App\Services\Random;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class RandomOrgProvider implements RandomProvider
{
    public function shuffle(array $values): array
    {
        if (empty($values)) {
            return [];
        }

        $apiKey = config('services.random_org.api_key');

        if (!$apiKey) {
            throw new RuntimeException(
                'Random.org API key is not configured.'
            );
        }

        $count = count($values);

        $response = Http::timeout(30)
            ->post(
                'https://api.random.org/json-rpc/4/invoke',
                [
                    'jsonrpc' => '2.0',
                    'method' => 'generateIntegers',
                    'params' => [
                        'apiKey' => $apiKey,
                        'n' => $count,
                        'min' => 0,
                        'max' => $count - 1,
                        'replacement' => false,
                    ],
                    'id' => now()->timestamp,
                ]
            );

        if (!$response->successful()) {
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

        if (!is_array($randomIndexes)) {
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
            if (!array_key_exists($index, $values)) {
                throw new RuntimeException(
                    'Random.org returned an invalid index.'
                );
            }

            $shuffled[] = $values[$index];
        }

        return $shuffled;
    }
}
