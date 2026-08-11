<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DrawEntry extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'draw_id',
        'receipt_id',
        'entry_number',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function draw(): BelongsTo
    {
        return $this->belongsTo(Draw::class);
    }

    public function receipt(): BelongsTo
    {
        return $this->belongsTo(Receipt::class);
    }
}
