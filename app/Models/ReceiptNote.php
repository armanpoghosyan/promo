<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReceiptNote extends Model
{
    use HasFactory;

    protected $fillable = [
        'receipt_id',
        'user_id',
        'note',
    ];

    public function receipt(): BelongsTo
    {
        return $this->belongsTo(
            Receipt::class
        );
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(
            User::class
        );
    }
}
