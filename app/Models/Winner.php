<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use App\Enums\WinnerStatus;

class Winner extends Model
{
    use HasFactory;

    protected $fillable = [
        'draw_id',
        'receipt_id',
        'prize_id',
        'status',
        'selected_at',
        'confirmed_at',
        'cancelled_at',
        'cancellation_reason',
        'replaced_winner_id',
        'confirmation_deadline'
    ];

    protected $casts = [
        'status' => WinnerStatus::class,
        'selected_at' => 'datetime',
        'confirmation_deadline' => 'datetime',
        'confirmed_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    public function draw(): BelongsTo
    {
        return $this->belongsTo(Draw::class);
    }

    public function receipt(): BelongsTo
    {
        return $this->belongsTo(Receipt::class);
    }

    public function prize(): BelongsTo
    {
        return $this->belongsTo(Prize::class);
    }

    public function replacedWinner(): BelongsTo
    {
        return $this->belongsTo(
            Winner::class,
            'replaced_winner_id'
        );
    }

    public function replacementWinner(): HasMany
    {
        return $this->hasMany(
            Winner::class,
            'replaced_winner_id'
        );
    }

    public function contactAttempts(): HasMany
    {
        return $this->hasMany(
            WinnerContactAttempt::class
        );
    }

    public function auditLogs(): MorphMany
    {
        return $this->morphMany(
            AuditLog::class,
            'auditable'
        );
    }
}
