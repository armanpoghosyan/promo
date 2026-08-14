<?php

namespace App\Models;

use App\Enums\ContactAttemptResult;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WinnerContactAttempt extends Model
{
    use HasFactory;

    protected $fillable = [
        'draw_winner_id',
        'created_by',
        'attempted_at',
        'result',
        'notes',
    ];

    protected $casts = [
        'result' => ContactAttemptResult::class,
        'attempted_at' => 'datetime',
    ];

    public function winner(): BelongsTo
    {
        return $this->belongsTo(
            DrawWinner::class,
            'draw_winner_id'
        );
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'created_by'
        );
    }
}
