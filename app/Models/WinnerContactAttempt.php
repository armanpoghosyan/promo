<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Enums\ContactAttemptResult;

class WinnerContactAttempt extends Model
{
    use HasFactory;

    protected $fillable = [
        'winner_id',
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
        return $this->belongsTo(Winner::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'created_by'
        );
    }
}
