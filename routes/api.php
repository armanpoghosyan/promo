<?php

use App\Http\Controllers\Api\ParticipantReceiptController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminReceiptController;
use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\AdminDrawController;
use App\Http\Controllers\Api\AdminWinnerController;
use App\Http\Controllers\Api\Admin\ReportController;
use App\Http\Controllers\Api\Admin\ReportExportController;
use App\Http\Controllers\Api\Admin\DashboardController;

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

        Route::get(
            '/dashboard',
            [AdminDashboardController::class, 'index']
        );

        Route::get(
            '/draws',
            [AdminDrawController::class, 'index']
        );

        Route::post(
            '/draws',
            [AdminDrawController::class, 'store']
        );

        Route::get(
            '/draws/{draw}',
            [AdminDrawController::class, 'show']
        );

        Route::put(
            '/draws/{draw}',
            [AdminDrawController::class, 'update']
        );

        Route::post(
            '/draws/{draw}/prizes',
            [AdminDrawController::class, 'addPrize']
        );

        Route::delete(
            '/draws/{draw}/prizes/{drawPrize}',
            [AdminDrawController::class, 'removePrize']
        );

        Route::post(
            '/draws/{draw}/snapshot',
            [AdminDrawController::class, 'createSnapshot']
        );

        Route::post(
            '/draws/{draw}/execute',
            [AdminDrawController::class, 'execute']
        );

         Route::post(
            'winners/{winner}/confirm',
            [AdminWinnerController::class, 'confirm']
        );

        Route::post(
            'winners/{winner}/contact-attempts',
            [AdminWinnerController::class, 'addContactAttempt']
        );

        Route::get(
            '/reports/overview',
            [ReportController::class, 'overview']
        );

        Route::get(
            '/reports/export/receipts',
            [ReportExportController::class, 'receipts']
        );

        Route::get(
            '/reports/export/winners',
            [ReportExportController::class, 'winners']
        );

        Route::get(
            '/reports/export/draws',
            [ReportExportController::class, 'draws']
        );

        Route::get(
            '/dashboard',
            [DashboardController::class, 'overview']
        );
    });
