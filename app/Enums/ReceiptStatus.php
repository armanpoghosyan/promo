<?php

namespace App\Enums;

enum ReceiptStatus: string
{
    case SUBMITTED = 'submitted';
    case APPROVED = 'approved';
    case REJECTED = 'rejected';
}
