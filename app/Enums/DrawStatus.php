<?php

namespace App\Enums;

enum DrawStatus: string
{
    case DRAFT = 'draft';
    case SCHEDULED = 'scheduled';
    case RUNNING = 'running';
    case COMPLETED = 'completed';
}
