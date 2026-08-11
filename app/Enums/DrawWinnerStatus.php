<?php

namespace App\Enums;

enum DrawWinnerStatus: string
{
    case SELECTED = 'selected';
    case CONTACTING = 'contacting';
    case CONFIRMED = 'confirmed';
    case CANCELLED = 'cancelled';
}
