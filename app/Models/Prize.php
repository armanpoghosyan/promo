<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use App\Enums\PrizeType;

class Prize extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'value',
        'currency',
        'total_quantity',
    ];

    protected $casts = [
        'type' => PrizeType::class,
    ];

    public function drawPrizes(): HasMany
    {
        return $this->hasMany(DrawPrize::class);
    }

    public function auditLogs(): MorphMany
    {
        return $this->morphMany(
            AuditLog::class,
            'auditable'
        );
    }
}
