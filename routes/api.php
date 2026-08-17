<?php

use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\DrawController;
use App\Http\Controllers\Api\Admin\ParticipantController;
use App\Http\Controllers\Api\Admin\ReceiptController;
use App\Http\Controllers\Api\Admin\ReportController;
use App\Http\Controllers\Api\Admin\ReportExportController;
use App\Http\Controllers\Api\Admin\WinnerController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ParticipantReceiptController;
use Illuminate\Support\Facades\Route;

Route::post(
    '/participants/receipts',
    [ParticipantReceiptController::class, 'store']
);

Route::post(
    '/admin/login',
    [AuthController::class, 'login']
);

Route::prefix('admin')
    ->middleware('auth:sanctum')
    ->group(function () {
        Route::post(
            '/logout',
            [AuthController::class, 'logout']
        );

        Route::get(
            '/me',
            [AuthController::class, 'me']
        );

        Route::get(
            '/receipts',
            [ReceiptController::class, 'index']
        );

        Route::get(
            '/receipts/{receipt}',
            [ReceiptController::class, 'show']
        );

        Route::post(
            '/receipts/{receipt}/approve',
            [ReceiptController::class, 'approve']
        );

        Route::post(
            '/receipts/{receipt}/reject',
            [ReceiptController::class, 'reject']
        );

        Route::post(
            '/receipts/{receipt}/notes',
            [ReceiptController::class, 'addNote']
        );

        Route::get(
            '/receipts/{receipt}/image',
            [ReceiptController::class, 'image']
        );

        Route::get(
            '/draws',
            [DrawController::class, 'index']
        );

        Route::post(
            '/draws',
            [DrawController::class, 'store']
        );

        Route::get(
            '/prizes',
            [DrawController::class, 'prizes']
        );

        Route::get(
            '/draws/{draw}',
            [DrawController::class, 'show']
        );

        Route::put(
            '/draws/{draw}',
            [DrawController::class, 'update']
        );

        Route::post(
            '/draws/{draw}/prizes',
            [DrawController::class, 'addPrize']
        );

        Route::delete(
            '/draws/{draw}/prizes/{drawPrize}',
            [DrawController::class, 'removePrize']
        );

        Route::post(
            '/draws/{draw}/snapshot',
            [DrawController::class, 'createSnapshot']
        );

        Route::post(
            '/draws/{draw}/execute',
            [DrawController::class, 'execute']
        );

        Route::get(
            '/winners',
            [WinnerController::class, 'index']
        );

        Route::get(
            '/winners/{winner}',
            [WinnerController::class, 'show']
        );

        Route::post(
            '/winners/{winner}/confirm',
            [WinnerController::class, 'confirm']
        );

        Route::post(
            '/winners/{winner}/contact-attempts',
            [WinnerController::class, 'addContactAttempt']
        );

        Route::post(
            '/winners/{winner}/cancel',
            [WinnerController::class, 'cancel']
        );

        Route::post(
            '/winners/{winner}/replace',
            [WinnerController::class, 'replace']
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

        Route::get(
            '/participants',
            [ParticipantController::class, 'index']
        );

        Route::get(
            '/participants/{participant}',
            [ParticipantController::class, 'show']
        );
    });
