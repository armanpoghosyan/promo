<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use App\Enums\DrawStatus;

class Draw extends Model
{
    use HasFactory;

    protected $fillable = [
        'week_number',
        'draw_date',
        'status',
        'started_at',
        'completed_at',
        'snapshot_at',
        'random_provider',
        'random_request_id',
        'random_request',
        'random_response',
        'randomized_at',
        'created_by',
    ];

    protected $casts = [
        'status' => DrawStatus::class,
        'draw_date' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'snapshot_at' => 'datetime',
        'random_request' => 'array',
        'random_response' => 'array',
        'randomized_at' => 'datetime',
    ];

    public function drawPrizes(): HasMany
    {
        return $this->hasMany(DrawPrize::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function auditLogs(): MorphMany
    {
        return $this->morphMany(
            AuditLog::class,
            'auditable'
        );
    }

    public function entries(): HasMany
    {
        return $this->hasMany(DrawEntry::class);
    }

    public function winners(): HasMany
    {
        return $this->hasMany(DrawWinner::class);
    }
}
