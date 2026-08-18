<?php

namespace App\Models;

use App\Enums\ReceiptStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

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
        'privacy_policy_accepted_at',
        'official_rules_accepted_at',
        'personal_data_consent_at',
        'verified_at',
        'verified_by',
        'rejection_reason',
    ];

    protected $casts = [
        'status' => ReceiptStatus::class,
        'is_suspicious' => 'boolean',
        'suspicious_reasons' => 'array',
        'submitted_at' => 'datetime',
        'privacy_policy_accepted_at' => 'datetime',
        'official_rules_accepted_at' => 'datetime',
        'personal_data_consent_at' => 'datetime',
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
        return $this->morphMany(AuditLog::class, 'auditable');
    }

    public function drawEntries(): HasMany
    {
        return $this->hasMany(DrawEntry::class);
    }

    public function notes(): HasMany
    {
        return $this->hasMany(ReceiptNote::class)
            ->latest('created_at');
    }

    public function drawWinners(): HasMany
    {
        return $this->hasMany(DrawWinner::class);
    }
}
