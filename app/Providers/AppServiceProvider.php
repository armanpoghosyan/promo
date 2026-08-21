<?php

namespace App\Providers;

use App\Services\Random\LocalRandomProvider;
use App\Services\Random\RandomOrgProvider;
use App\Services\Random\RandomProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use RuntimeException;

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
                    'local' => app()->environment('production')
                        ? throw new RuntimeException(
                            'The local random provider is disabled in production.'
                        )
                        : app(LocalRandomProvider::class),
                    default => throw new RuntimeException(
                        'The configured random provider is not supported.'
                    ),
                };
            }
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for(
            'receipt-submissions',
            fn (Request $request) => Limit::perMinute(10)
                ->by($request->ip())
        );

        RateLimiter::for(
            'admin-login',
            fn (Request $request) => Limit::perMinute(5)
                ->by(
                    Str::lower(
                        $request->string('email')->toString()
                    ).'|'.$request->ip()
                )
        );
    }
}
