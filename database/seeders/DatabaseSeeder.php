<?php

namespace Database\Seeders;

use App\Enums\ReceiptStatus;
use App\Enums\UserRole;
use App\Models\Participant;
use App\Models\Receipt;
use App\Models\User;
use App\Services\ParticipantIdentityService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::create([
            'name' => 'Test Admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'role' => UserRole::ADMIN,
        ]);

        $this->call([
            PrizeSeeder::class,
        ]);

        $participants = [
            [
                'first_name' => 'Arman',
                'last_name' => 'Petrosyan',
                'phone' => '+374 91 111111',
                'email' => 'arman@example.com',
                'receipts' => [
                    [
                        'number' => '100001',
                        'status' => ReceiptStatus::APPROVED,
                    ],
                    [
                        'number' => '100002',
                        'status' => ReceiptStatus::APPROVED,
                    ],
                    [
                        'number' => '100003',
                        'status' => ReceiptStatus::APPROVED,
                    ],
                ],
            ],
            [
                'first_name' => 'Anna',
                'last_name' => 'Hakobyan',
                'phone' => '+374 91 222222',
                'email' => 'anna@example.com',
                'receipts' => [
                    [
                        'number' => '200001',
                        'status' => ReceiptStatus::APPROVED,
                    ],
                    [
                        'number' => '200002',
                        'status' => ReceiptStatus::SUBMITTED,
                    ],
                ],
            ],
            [
                'first_name' => 'David',
                'last_name' => 'Sargsyan',
                'phone' => '+374 91 333333',
                'email' => 'david@example.com',
                'receipts' => [
                    [
                        'number' => '300001',
                        'status' => ReceiptStatus::REJECTED,
                    ],
                ],
            ],
            [
                'first_name' => 'Mariam',
                'last_name' => 'Grigoryan',
                'phone' => '+374 91 444444',
                'email' => 'mariam@example.com',
                'receipts' => [
                    [
                        'number' => '400001',
                        'status' => ReceiptStatus::SUBMITTED,
                    ],
                ],
            ],
            [
                'first_name' => 'Narek',
                'last_name' => 'Avetisyan',
                'phone' => '+374 91 555555',
                'email' => 'narek@example.com',
                'receipts' => [
                    [
                        'number' => '500001',
                        'status' => ReceiptStatus::SUBMITTED,
                        'suspicious' => true,
                        'reasons' => [
                            'duplicate_receipt_image',
                        ],
                    ],
                ],
            ],
            [
                'first_name' => 'Lilit',
                'last_name' => 'Martirosyan',
                'phone' => '+374 91 666666',
                'email' => 'lilit@example.com',
                'receipts' => [
                    [
                        'number' => '600001',
                        'status' => ReceiptStatus::APPROVED,
                    ],
                    [
                        'number' => '600002',
                        'status' => ReceiptStatus::APPROVED,
                    ],
                    [
                        'number' => '600003',
                        'status' => ReceiptStatus::APPROVED,
                    ],
                    [
                        'number' => '600004',
                        'status' => ReceiptStatus::APPROVED,
                    ],
                ],
            ],
            [
                'first_name' => 'Gor',
                'last_name' => 'Karapetyan',
                'phone' => '+374 91 777777',
                'email' => 'gor@example.com',
                'receipts' => [
                    [
                        'number' => '700001',
                        'status' => ReceiptStatus::APPROVED,
                    ],
                ],
            ],
            [
                'first_name' => 'Sona',
                'last_name' => 'Mkrtchyan',
                'phone' => '+374 91 888888',
                'email' => 'sona@example.com',
                'receipts' => [
                    [
                        'number' => '800001',
                        'status' => ReceiptStatus::APPROVED,
                    ],
                ],
            ],
        ];

        $identityService = app(
            ParticipantIdentityService::class
        );

        foreach ($participants as $participantData) {
            $participant = Participant::create([
                'first_name' =>
                    $participantData['first_name'],
                'last_name' =>
                    $participantData['last_name'],
                'phone' =>
                    $participantData['phone'],
                'phone_normalized' =>
                    $identityService->normalizePhone(
                        $participantData['phone']
                    ),
                'email' =>
                    $participantData['email'],
                'email_normalized' =>
                    $identityService->normalizeEmail(
                        $participantData['email']
                    ),
            ]);

            foreach (
                $participantData['receipts']
                as $receiptData
            ) {
                $status = $receiptData['status'];
                $submittedAt = now()->subDays(2);

                Receipt::create([
                    'participant_id' =>
                        $participant->id,
                    'receipt_number' =>
                        $receiptData['number'],
                    'receipt_image' =>
                        'receipts/test.jpg',
                    'image_hash' =>
                        hash(
                            'sha256',
                            $participant->id .
                            ':' .
                            $receiptData['number']
                        ),
                    'status' =>
                        $status,
                    'is_suspicious' =>
                        $receiptData['suspicious']
                        ?? false,
                    'suspicious_reasons' =>
                        $receiptData['reasons']
                        ?? null,
                    'submitted_at' =>
                        $submittedAt,
                    'privacy_policy_accepted_at' =>
                        $submittedAt,
                    'official_rules_accepted_at' =>
                        $submittedAt,
                    'personal_data_consent_at' =>
                        $submittedAt,
                    'verified_at' =>
                        $status ===
                        ReceiptStatus::SUBMITTED
                            ? null
                            : now()->subDay(),
                    'verified_by' =>
                        $status ===
                        ReceiptStatus::SUBMITTED
                            ? null
                            : $admin->id,
                    'rejection_reason' =>
                        $status ===
                        ReceiptStatus::REJECTED
                            ? 'Receipt information could not be verified.'
                            : null,
                ]);
            }
        }
    }
}
