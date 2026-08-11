<?php

namespace App\Services\Random;

class LocalRandomProvider implements RandomProvider
{
    public function shuffle(array $values): array
    {
        $values = array_values($values);

        shuffle($values);

        return $values;
    }
}
