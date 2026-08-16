<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Participant extends Model
{
    use HasFactory;

    protected $fillable = [
        'first_name',
        'last_name',
        'phone',
        'phone_normalized',
        'email',
        'email_normalized',
        'privacy_policy_accepted_at',
        'official_rules_accepted_at',
        'personal_data_consent_at',
    ];

    protected $hidden = [
        'phone_normalized',
        'email_normalized',
    ];

    protected $casts = [
        'privacy_policy_accepted_at' => 'datetime',
        'official_rules_accepted_at' => 'datetime',
        'personal_data_consent_at' => 'datetime',
    ];

    public function receipts(): HasMany
    {
        return $this->hasMany(Receipt::class);
    }
}
