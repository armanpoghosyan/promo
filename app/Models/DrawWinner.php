<?php

namespace App\Models;

use App\Enums\DrawWinnerStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class DrawWinner extends Model
{
    use HasFactory;

    protected $fillable = [
        'draw_id',
        'draw_prize_id',
        'receipt_id',
        'entry_number',
        'status',
        'selected_at',
        'confirmed_at',
        'cancelled_at',
        'cancellation_reason',
        'replaced_winner_id',
    ];

    protected $casts = [
        'status' => DrawWinnerStatus::class,
        'selected_at' => 'datetime',
        'confirmed_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    public function draw(): BelongsTo
    {
        return $this->belongsTo(Draw::class);
    }

    public function drawPrize(): BelongsTo
    {
        return $this->belongsTo(DrawPrize::class);
    }

    public function receipt(): BelongsTo
    {
        return $this->belongsTo(Receipt::class);
    }

    public function contactAttempts(): HasMany
    {
        return $this->hasMany(
            WinnerContactAttempt::class
        );
    }

    public function replacedWinner(): BelongsTo
    {
        return $this->belongsTo(
            DrawWinner::class,
            'replaced_winner_id'
        );
    }

    public function replacementWinner(): HasOne
    {
        return $this->hasOne(
            DrawWinner::class,
            'replaced_winner_id'
        );
    }
}
