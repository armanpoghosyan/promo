<?php

namespace Tests\Unit;

use App\Http\Requests\SubmitReceiptRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class SubmitReceiptRequestTest extends TestCase
{
    public function test_supported_armenian_phone_formats_are_valid(): void
    {
        foreach ([
            '091123456',
            '91123456',
            '+37491123456',
            '374 91 123 456',
        ] as $phone) {
            $validator = Validator::make(
                $this->submissionData($phone),
                (new SubmitReceiptRequest)->rules()
            );

            $this->assertFalse(
                $validator->errors()->has('phone'),
                "Expected [{$phone}] to be accepted."
            );
        }
    }

    public function test_invalid_or_international_phone_formats_are_rejected(): void
    {
        foreach ([
            'abc',
            '+12025550123',
            '09112345',
            '374911234567',
        ] as $phone) {
            $validator = Validator::make(
                $this->submissionData($phone),
                (new SubmitReceiptRequest)->rules()
            );

            $this->assertTrue(
                $validator->errors()->has('phone'),
                "Expected [{$phone}] to be rejected."
            );
        }
    }

    private function submissionData(string $phone): array
    {
        return [
            'turnstile_token' => 'test-token',
            'first_name' => 'Aram',
            'last_name' => 'Petrosyan',
            'phone' => $phone,
            'email' => 'aram@example.com',
            'receipt_number' => '0012345',
            'receipt_image' => UploadedFile::fake()->image('receipt.jpg'),
            'privacy_policy_accepted' => true,
            'official_rules_accepted' => true,
            'personal_data_consent' => true,
        ];
    }
}
