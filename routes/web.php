<?php

use Illuminate\Support\Facades\Route;

Route::get('/admin/{any?}', function () {
    return view('admin');
})->where('any', '.*');
