<?php

namespace App\Enums;

enum DrawStatus: string
{
    case SCHEDULED = 'scheduled';
    case IN_PROGRESS = 'in_progress';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';
    case DRAFT = 'draft';
    case RUNNING = 'running';
}
