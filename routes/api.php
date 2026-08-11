<?php

use App\Http\Controllers\Api\ParticipantReceiptController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminReceiptController;

Route::post(
    '/participants/receipts',
    [ParticipantReceiptController::class, 'store']
);

Route::post(
    '/admin/login',
    [AuthController::class, 'login']
);

Route::middleware('auth:sanctum')->group(function () {

    Route::post(
        '/admin/logout',
        [AuthController::class, 'logout']
    );

    Route::get(
        '/admin/me',
        [AuthController::class, 'me']
    );

});

Route::middleware('auth:sanctum')
    ->prefix('admin')
    ->group(function () {

        Route::get(
            '/receipts',
            [AdminReceiptController::class, 'index']
        );

        Route::get(
            '/receipts/{receipt}',
            [AdminReceiptController::class, 'show']
        );

        Route::post(
            '/receipts/{receipt}/approve',
            [AdminReceiptController::class, 'approve']
        );

        Route::post(
            '/receipts/{receipt}/reject',
            [AdminReceiptController::class, 'reject']
        );

        Route::post(
            '/receipts/{receipt}/notes',
            [AdminReceiptController::class, 'addNote']
        );

        Route::get(
            '/receipts/{receipt}/image',
            [AdminReceiptController::class, 'image']
        );
    });
