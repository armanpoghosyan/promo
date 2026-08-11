<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReceiptNote extends Model
{
    protected $fillable = [
        'receipt_id',
        'user_id',
        'note',
    ];
}
