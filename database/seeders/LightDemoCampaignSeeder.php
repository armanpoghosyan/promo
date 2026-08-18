<?php

namespace Database\Seeders;

use App\Enums\ReceiptStatus;
use App\Models\Participant;
use App\Models\Receipt;
use App\Models\User;
use App\Services\ParticipantIdentityService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class LightDemoCampaignSeeder extends Seeder
{
    private User $admin;

    private ParticipantIdentityService $identityService;

    private array $receiptImages = [];

    public function run(): void
    {
        $this->admin = User::query()
            ->where('email', 'admin@example.com')
            ->firstOrFail();

        $this->identityService = app(
            ParticipantIdentityService::class
        );

        $this->prepareReceiptImages();

        $participants = [
            [
                'first_name' => 'Arman',
                'last_name' => 'Petrosyan',
                'phone' => '+374 91 111111',
                'email' => 'arman@example.com',
                'receipts' => [
                    ['number' => '100001', 'status' => ReceiptStatus::APPROVED],
                    ['number' => '100002', 'status' => ReceiptStatus::APPROVED],
                    ['number' => '100003', 'status' => ReceiptStatus::APPROVED],
                ],
            ],
            [
                'first_name' => 'Anna',
                'last_name' => 'Hakobyan',
                'phone' => '+374 91 222222',
                'email' => 'anna@example.com',
                'receipts' => [
                    ['number' => '200001', 'status' => ReceiptStatus::APPROVED],
                    ['number' => '200002', 'status' => ReceiptStatus::SUBMITTED],
                ],
            ],
            [
                'first_name' => 'David',
                'last_name' => 'Sargsyan',
                'phone' => '+374 91 333333',
                'email' => 'david@example.com',
                'receipts' => [
                    ['number' => '300001', 'status' => ReceiptStatus::REJECTED],
                ],
            ],
            [
                'first_name' => 'Mariam',
                'last_name' => 'Grigoryan',
                'phone' => '+374 91 444444',
                'email' => 'mariam@example.com',
                'receipts' => [
                    ['number' => '400001', 'status' => ReceiptStatus::SUBMITTED],
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
                    ['number' => '600001', 'status' => ReceiptStatus::APPROVED],
                    ['number' => '600002', 'status' => ReceiptStatus::APPROVED],
                    ['number' => '600003', 'status' => ReceiptStatus::APPROVED],
                    ['number' => '600004', 'status' => ReceiptStatus::APPROVED],
                ],
            ],
            [
                'first_name' => 'Gor',
                'last_name' => 'Karapetyan',
                'phone' => '+374 91 777777',
                'email' => 'gor@example.com',
                'receipts' => [
                    ['number' => '700001', 'status' => ReceiptStatus::APPROVED],
                ],
            ],
            [
                'first_name' => 'Sona',
                'last_name' => 'Mkrtchyan',
                'phone' => '+374 91 888888',
                'email' => 'sona@example.com',
                'receipts' => [
                    ['number' => '800001', 'status' => ReceiptStatus::APPROVED],
                ],
            ],
        ];

        $receiptIndex = 0;

        foreach ($participants as $participantData) {
            $participant = $this->createParticipant(
                $participantData
            );

            foreach ($participantData['receipts'] as $receiptData) {
                $receiptIndex++;

                $this->createReceipt(
                    $participant,
                    $receiptData,
                    $receiptIndex
                );
            }
        }

        $this->command?->info(
            'Light demo dataset seeded successfully.'
        );

        $this->command?->info(
            'Participants: '.Participant::count()
        );

        $this->command?->info(
            'Receipts: '.Receipt::count()
        );
    }

    private function prepareReceiptImages(): void
    {
        Storage::disk('private')->deleteDirectory(
            'receipts/light-demo'
        );

        $files = [
            'Receipt1.jpeg',
            'Receipt2.webp',
            'Receipt3.png',
            'Receipt4.jpg',
            'Receipt5.jpg',
            'Receipt6.jpg',
            'Receipt7.jpg',
        ];

        foreach ($files as $file) {
            $source = database_path(
                'seeders/TestReciptPhotos/'.$file
            );

            if (! is_file($source)) {
                throw new RuntimeException(
                    "Test receipt image not found: {$source}"
                );
            }

            $target = 'receipts/light-demo/'.$file;

            Storage::disk('private')->put(
                $target,
                file_get_contents($source)
            );

            $this->receiptImages[] = $target;
        }
    }

    private function createParticipant(
        array $participantData
    ): Participant {
        return Participant::create([
            'first_name' => $participantData['first_name'],
            'last_name' => $participantData['last_name'],
            'phone' => $participantData['phone'],
            'phone_normalized' => $this->identityService
                ->normalizePhone($participantData['phone']),
            'email' => $participantData['email'],
            'email_normalized' => $this->identityService
                ->normalizeEmail($participantData['email']),
        ]);
    }

    private function createReceipt(
        Participant $participant,
        array $receiptData,
        int $index
    ): void {
        $status = $receiptData['status'];

        $submittedAt = Carbon::parse(
            '2026-08-16 10:00:00'
        )->addMinutes($index * 17);

        $verifiedAt = $status === ReceiptStatus::SUBMITTED
            ? null
            : (clone $submittedAt)->addHours(4);

        $receiptImage = $this->receiptImages[
            ($index - 1) % count($this->receiptImages)
        ];

        Receipt::create([
            'participant_id' => $participant->id,
            'receipt_number' => $receiptData['number'],
            'receipt_image' => $receiptImage,
            'image_hash' => hash(
                'sha256',
                'light-demo-'.$receiptData['number']
            ),
            'status' => $status,
            'is_suspicious' => $receiptData['suspicious'] ?? false,
            'suspicious_reasons' => $receiptData['reasons'] ?? null,
            'submitted_at' => $submittedAt,
            'privacy_policy_accepted_at' => $submittedAt,
            'official_rules_accepted_at' => $submittedAt,
            'personal_data_consent_at' => $submittedAt,
            'verified_at' => $verifiedAt,
            'verified_by' => $verifiedAt
                ? $this->admin->id
                : null,
            'rejection_reason' => $status === ReceiptStatus::REJECTED
                    ? 'Receipt information could not be verified.'
                    : null,
            'created_at' => $submittedAt,
            'updated_at' => $verifiedAt ?? $submittedAt,
        ]);
    }
}
