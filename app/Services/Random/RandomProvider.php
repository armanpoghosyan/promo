<?php

namespace App\Services\Random;

interface RandomProvider
{
    /**
     * @param array<int, int> $values
     */
    public function shuffle(array $values): RandomResult;
}
