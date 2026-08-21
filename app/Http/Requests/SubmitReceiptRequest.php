<?php

namespace App\Http\Requests;

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
            'turnstile_token' => [
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
