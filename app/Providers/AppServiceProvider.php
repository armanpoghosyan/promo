<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\Random\LocalRandomProvider;
use App\Services\Random\RandomProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(
            RandomProvider::class,
            LocalRandomProvider::class
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
