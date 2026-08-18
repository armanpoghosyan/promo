<?php

namespace App\Providers;

use App\Services\Random\LocalRandomProvider;
use App\Services\Random\RandomOrgProvider;
use App\Services\Random\RandomProvider;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {

        $this->app->bind(
            RandomProvider::class,
            function () {
                return match (config('services.random.provider')) {
                    'random_org' => app(RandomOrgProvider::class),
                    default => app(LocalRandomProvider::class),
                };
            }
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
