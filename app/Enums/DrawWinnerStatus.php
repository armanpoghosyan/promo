<?php

namespace App\Enums;

enum DrawWinnerStatus: string
{
    case SELECTED = 'selected';
    case CONFIRMED = 'confirmed';
    case CANCELLED = 'cancelled';
}
