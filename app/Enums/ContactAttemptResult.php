<?php

namespace App\Enums;

enum ContactAttemptResult: string
{
    case NO_ANSWER = 'no_answer';
    case BUSY = 'busy';
    case WRONG_NUMBER = 'wrong_number';
    case CONTACTED = 'contacted';
    case OTHER = 'other';
}
