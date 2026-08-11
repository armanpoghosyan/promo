<?php

namespace App\Enums;

enum ReceiptStatus: string
{
    case SUBMITTED = 'submitted';
    case REVIEWING = 'reviewing';
    case APPROVED = 'approved';
    case REJECTED = 'rejected';
    case WINNER = 'winner';
    case CANCELLED = 'cancelled';
}
