<?php

namespace App\Http\Requests;

use Closure;
use Illuminate\Foundation\Http\FormRequest;

class SubmitReceiptRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'turnstile_token' => app()->environment('local')
            ? [
                'nullable',
                'string',
                'max:2048',
            ]
            : [
                'required',
                'string',
                'max:2048',
            ],
            'first_name' => [
                'required',
                'string',
                'max:100',
            ],

            'last_name' => [
                'required',
                'string',
                'max:100',
            ],

            'phone' => [
                'required',
                'string',
                'max:30',
                function (
                    string $attribute,
                    mixed $value,
                    Closure $fail
                ): void {
                    if (
                        ! is_string($value)
                        || preg_match('/^\+?[0-9\s().-]+$/', $value) !== 1
                    ) {
                        $fail('The phone number must be a valid Armenian phone number.');

                        return;
                    }

                    $digits = preg_replace('/\D+/', '', $value) ?? '';

                    if (
                        preg_match('/^[1-9]\d{7}$/', $digits) !== 1
                        && preg_match('/^0[1-9]\d{7}$/', $digits) !== 1
                        && preg_match('/^374[1-9]\d{7}$/', $digits) !== 1
                    ) {
                        $fail('The phone number must be a valid Armenian phone number.');
                    }
                },
            ],

            'email' => [
                'required',
                'email',
                'max:255',
            ],

            'receipt_number' => [
                'required',
                'string',
                'max:100',
            ],

            'receipt_image' => [
                'required',
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:10240',
            ],

            'privacy_policy_accepted' => [
                'accepted',
            ],

            'official_rules_accepted' => [
                'accepted',
            ],

            'personal_data_consent' => [
                'accepted',
            ],
        ];
    }
}
