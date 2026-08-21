<?php

namespace App\Services;

use Carbon\CarbonImmutable;
use Throwable;

class CampaignWindowService
{
    /**
     * @return array{open: bool, message: string|null, status: int}
     */
    public function submissionStatus(): array
    {
        $startValue = config('campaign.start_at');
        $endValue = config('campaign.end_at');

        if (! $startValue || ! $endValue) {
            if (app()->environment('production')) {
                return $this->closed(
                    'Campaign submissions are temporarily unavailable.',
                    503
                );
            }

            return $this->open();
        }

        try {
            $timezone = config('app.timezone');
            $start = CarbonImmutable::parse($startValue, $timezone);
            $end = CarbonImmutable::parse($endValue, $timezone);
        } catch (Throwable) {
            return $this->closed(
                'Campaign submissions are temporarily unavailable.',
                503
            );
        }

        if ($start->greaterThanOrEqualTo($end)) {
            return $this->closed(
                'Campaign submissions are temporarily unavailable.',
                503
            );
        }

        $now = CarbonImmutable::now($timezone);

        if ($now->isBefore($start)) {
            return $this->closed(
                'The campaign has not started yet.',
                422
            );
        }

        if ($now->isAfter($end)) {
            return $this->closed(
                'The campaign has ended.',
                422
            );
        }

        return $this->open();
    }

    /**
     * @return array{open: true, message: null, status: 200}
     */
    private function open(): array
    {
        return [
            'open' => true,
            'message' => null,
            'status' => 200,
        ];
    }

    /**
     * @return array{open: false, message: string, status: int}
     */
    private function closed(string $message, int $status): array
    {
        return [
            'open' => false,
            'message' => $message,
            'status' => $status,
        ];
    }
}
