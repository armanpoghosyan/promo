<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Model;
use App\Enums\ReceiptStatus;

class Receipt extends Model
{
    use HasFactory;

    protected $fillable = [
        'participant_id',
        'receipt_number',
        'receipt_image',
        'image_hash',
        'status',
        'is_suspicious',
        'suspicious_reasons',
        'submitted_at',
        'verified_at',
        'verified_by',
        'rejection_reason',
        'notes',
    ];

    protected $casts = [
        'status' => ReceiptStatus::class,
        'is_suspicious' => 'boolean',
        'suspicious_reasons' => 'array',
        'submitted_at' => 'datetime',
        'verified_at' => 'datetime',
    ];

    public function participant(): BelongsTo
    {
        return $this->belongsTo(Participant::class);
    }

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function auditLogs(): MorphMany
    {
        return $this->morphMany(
            AuditLog::class,
            'auditable'
        );
    }
    public function drawEntries(): HasMany
    {
        return $this->hasMany(DrawEntry::class);
    }
}
