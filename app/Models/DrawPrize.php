<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DrawPrize extends Model
{
    use HasFactory;

    protected $fillable = [
        'draw_id',
        'prize_id',
        'quantity',
    ];

    public function draw(): BelongsTo
    {
        return $this->belongsTo(Draw::class);
    }

    public function prize(): BelongsTo
    {
        return $this->belongsTo(Prize::class);
    }

    public function auditLogs(): MorphMany
    {
        return $this->morphMany(
            AuditLog::class,
            'auditable'
        );
    }

    public function winners(): HasMany
    {
        return $this->hasMany(DrawWinner::class);
    }
}
