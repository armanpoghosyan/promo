<?php

use App\Http\Controllers\Api\ParticipantReceiptController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminReceiptController;
use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\Admin\DrawController;
use App\Http\Controllers\Api\Admin\WinnerController;
use App\Http\Controllers\Api\Admin\ReportController;
use App\Http\Controllers\Api\Admin\ReportExportController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\AdminParticipantController;

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


//Route::middleware('auth:sanctum')
Route::prefix('admin')
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
            'winners/{winner}/confirm',
            [WinnerController::class, 'confirm']
        );

        Route::post(
            'winners/{winner}/contact-attempts',
            [WinnerController::class, 'addContactAttempt']
        );

        Route::post(
            'winners/{winner}/cancel',
            [WinnerController::class, 'cancel']
        );

        Route::post(
            'winners/{winner}/replace',
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
            [AdminParticipantController::class, 'index']
        );

        Route::get(
            '/participants/{participant}',
            [AdminParticipantController::class, 'show']
        );
    });
