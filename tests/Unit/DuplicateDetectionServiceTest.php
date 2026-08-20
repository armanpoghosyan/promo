<?php

namespace Tests\Unit;

use App\Models\Participant;
use App\Models\Receipt;
use App\Services\DuplicateDetectionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class DuplicateDetectionServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_numeric_receipt_number_is_not_flagged_for_format(): void
    {
        $participant =
            Participant::factory()->create([
                'phone_normalized' => '37499111222',

                'email_normalized' => 'test@example.com',
            ]);

        $image =
            UploadedFile::fake()->image(
                'receipt.jpg'
            );

        $service =
            app(
                DuplicateDetectionService::class
            );

        $result =
            $service->check(
                receiptNumber: '123456789',

                participant: $participant,

                phoneNormalized: '37499111222',

                emailNormalized: 'test@example.com',

                image: $image
            );

        $this->assertNotContains(
            'receipt_number_non_numeric',
            $result['reasons']
        );

        $this->assertFalse(
            $result['is_suspicious']
        );
    }

    public function test_non_numeric_receipt_number_is_accepted_but_flagged(): void
    {
        $participant =
            Participant::factory()->create([
                'phone_normalized' => '37499111222',

                'email_normalized' => 'test@example.com',
            ]);

        $image =
            UploadedFile::fake()->image(
                'receipt.jpg'
            );

        $service =
            app(
                DuplicateDetectionService::class
            );

        $result =
            $service->check(
                receiptNumber: 'ABC-12345',

                participant: $participant,

                phoneNormalized: '37499111222',

                emailNormalized: 'test@example.com',

                image: $image
            );

        $this->assertTrue(
            $result['is_suspicious']
        );

        $this->assertContains(
            'receipt_number_non_numeric',
            $result['reasons']
        );
    }

    public function test_receipt_can_have_multiple_suspicious_reasons(): void
    {
        $participant =
            Participant::factory()->create([
                'phone_normalized' => '37499111222',

                'email_normalized' => 'test@example.com',
            ]);

        Receipt::factory()->create([
            'participant_id' => $participant->id,

            'receipt_number' => 'ABC-12345',
        ]);

        $image =
            UploadedFile::fake()->image(
                'receipt.jpg'
            );

        $service =
            app(
                DuplicateDetectionService::class
            );

        $result =
            $service->check(
                receiptNumber: 'ABC-12345',

                participant: $participant,

                phoneNormalized: '37499111222',

                emailNormalized: 'test@example.com',

                image: $image
            );

        $this->assertContains(
            'receipt_number_non_numeric',
            $result['reasons']
        );

        $this->assertContains(
            'duplicate_receipt_number',
            $result['reasons']
        );

        $this->assertTrue(
            $result['is_suspicious']
        );
    }
}
