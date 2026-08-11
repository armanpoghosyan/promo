<?php

namespace App\Services\Random;

interface RandomProvider
{
    /**
     * @param array<int, int> $values
     * @return array<int, int>
     */
    public function shuffle(array $values): array;
}
