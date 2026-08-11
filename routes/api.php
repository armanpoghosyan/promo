<?php

use App\Http\Controllers\Api\ParticipantReceiptController;
use Illuminate\Support\Facades\Route;

Route::post(
    '/participants/receipts',
    [ParticipantReceiptController::class, 'store']
);
