<?php

namespace App\Services\Random;

class LocalRandomProvider implements RandomProvider
{
    public function shuffle(array $values): RandomResult
    {
        $input = array_values($values);
        $shuffled = $input;

        shuffle($shuffled);

        return new RandomResult(
            values: $shuffled,
            provider: 'local',
            request: [
                'entries' => $input,
            ],
            response: [
                'values' => $shuffled,
            ]
        );
    }
}
