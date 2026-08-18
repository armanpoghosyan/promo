<?php

namespace Database\Seeders;

use App\Enums\ContactAttemptResult;
use App\Enums\DrawStatus;
use App\Enums\DrawWinnerStatus;
use App\Enums\ReceiptStatus;
use App\Models\AuditLog;
use App\Models\Draw;
use App\Models\DrawEntry;
use App\Models\DrawPrize;
use App\Models\DrawWinner;
use App\Models\Participant;
use App\Models\Prize;
use App\Models\Receipt;
use App\Models\ReceiptNote;
use App\Models\User;
use App\Models\WinnerContactAttempt;
use App\Services\ParticipantIdentityService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class DemoCampaignSeeder extends Seeder
{
    private const PARTICIPANT_COUNT = 650;

    private const RECEIPT_COUNT = 1000;

    private const APPROVED_COUNT = 760;

    private const SUBMITTED_COUNT = 150;

    private const REJECTED_COUNT = 90;

    private const CAMPAIGN_START = '2026-08-01 09:00:00';

    private const DEMO_NOW = '2026-08-18 20:00:00';

    private User $admin;

    private ParticipantIdentityService $identityService;

    private array $receiptImages = [];

    public function run(): void
    {
        $this->admin = User::query()
            ->where('email', 'admin@example.com')
            ->firstOrFail();

        $this->identityService = app(ParticipantIdentityService::class);

        mt_srand(20260818);

        $this->prepareReceiptImages();

        $participants = $this->createParticipants();

        $this->createReceipts($participants);

        $this->createDraws();

        $this->createReceiptNotes();

        $this->command?->info('Demo campaign seeded successfully.');
        $this->command?->info('Participants: '.Participant::count());
        $this->command?->info('Receipts: '.Receipt::count());
        $this->command?->info('Draws: '.Draw::count());
        $this->command?->info('Winner records: '.DrawWinner::count());
    }

    private function prepareReceiptImages(): void
    {
        Storage::disk('private')->deleteDirectory('receipts/demo');

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
                    "Demo receipt image not found: {$source}"
                );
            }

            $target = 'receipts/demo/'.$file;

            Storage::disk('private')->put(
                $target,
                file_get_contents($source)
            );

            $this->receiptImages[] = $target;
        }
    }

    private function createParticipants(): array
    {
        $firstNames = [
            'Arman',
            'Anna',
            'Narek',
            'Mariam',
            'Gor',
            'Lilit',
            'David',
            'Sona',
            'Tigran',
            'Ani',
            'Hayk',
            'Mane',
            'Vahan',
            'Nare',
            'Karen',
            'Lusine',
            'Artur',
            'Marine',
            'Samvel',
            'Gayane',
        ];

        $lastNames = [
            'Petrosyan',
            'Hakobyan',
            'Sargsyan',
            'Grigoryan',
            'Avetisyan',
            'Martirosyan',
            'Karapetyan',
            'Mkrtchyan',
            'Harutyunyan',
            'Hovhannisyan',
            'Manukyan',
            'Ghazaryan',
            'Vardanyan',
            'Stepanyan',
            'Poghosyan',
            'Sahakyan',
            'Arzumanyan',
            'Margaryan',
            'Khachatryan',
            'Babayan',
        ];

        $participants = [];

        for ($i = 1; $i <= self::PARTICIPANT_COUNT; $i++) {
            $firstName = $firstNames[
                ($i - 1) % count($firstNames)
            ];

            $lastName = $lastNames[
                (($i - 1) * 7) % count($lastNames)
            ];

            $localPhone = str_pad(
                (string) $i,
                6,
                '0',
                STR_PAD_LEFT
            );

            $phone = sprintf(
                '+374 91 %s %s',
                substr($localPhone, 0, 3),
                substr($localPhone, 3, 3)
            );

            $email = sprintf(
                'participant%04d@example.test',
                $i
            );

            $participants[] = Participant::create([
                'first_name' => $firstName,
                'last_name' => $lastName,
                'phone' => $phone,
                'phone_normalized' => $this->identityService
                    ->normalizePhone($phone),
                'email' => $email,
                'email_normalized' => $this->identityService
                    ->normalizeEmail($email),
            ]);
        }

        return $participants;
    }

    private function createReceipts(array $participants): void
    {
        $statuses = array_merge(
            array_fill(
                0,
                self::APPROVED_COUNT,
                ReceiptStatus::APPROVED
            ),
            array_fill(
                0,
                self::SUBMITTED_COUNT,
                ReceiptStatus::SUBMITTED
            ),
            array_fill(
                0,
                self::REJECTED_COUNT,
                ReceiptStatus::REJECTED
            )
        );

        shuffle($statuses);

        $campaignStart = Carbon::parse(self::CAMPAIGN_START);
        $demoNow = Carbon::parse(self::DEMO_NOW);

        for ($i = 1; $i <= self::RECEIPT_COUNT; $i++) {
            if ($i <= self::PARTICIPANT_COUNT) {
                $participant = $participants[$i - 1];
            } else {
                $participant = $participants[
                    array_rand($participants)
                ];
            }

            $status = $statuses[$i - 1];

            $submittedAt = $this->randomDate(
                $campaignStart,
                $demoNow
            );

            $verifiedAt = null;

            if ($status !== ReceiptStatus::SUBMITTED) {
                $verifiedAt = (clone $submittedAt)
                    ->addHours(mt_rand(1, 36));

                if ($verifiedAt->greaterThan($demoNow)) {
                    $verifiedAt = clone $demoNow;
                }
            }

            $isSuspicious = $i % 14 === 0;

            $suspiciousReasons = null;

            if ($isSuspicious) {
                $possibleReasons = [
                    'duplicate_receipt_number',
                    'duplicate_receipt_image',
                    'phone_used_by_another_participant',
                    'email_used_by_another_participant',
                ];

                $suspiciousReasons = [
                    $possibleReasons[
                        $i % count($possibleReasons)
                    ],
                ];

                if ($i % 42 === 0) {
                    $suspiciousReasons[] =
                        'duplicate_receipt_image';
                }

                $suspiciousReasons = array_values(
                    array_unique($suspiciousReasons)
                );
            }

            $receiptNumber = sprintf(
                'RCPT-2026-%06d',
                $i
            );

            $receiptImage = $this->receiptImages[
                ($i - 1) % count($this->receiptImages)
            ];

            Receipt::create([
                'participant_id' => $participant->id,
                'receipt_number' => $receiptNumber,
                'receipt_image' => $receiptImage,

                // Unique hash for normal demo receipts.
                // Suspicious state is controlled separately.
                'image_hash' => hash(
                    'sha256',
                    'demo-receipt-'.$i
                ),

                'status' => $status,
                'is_suspicious' => $isSuspicious,
                'suspicious_reasons' => $suspiciousReasons,

                'submitted_at' => $submittedAt,

                'privacy_policy_accepted_at' => $submittedAt,
                'official_rules_accepted_at' => $submittedAt,
                'personal_data_consent_at' => $submittedAt,

                'verified_at' => $verifiedAt,
                'verified_by' => $verifiedAt
                    ? $this->admin->id
                    : null,

                'rejection_reason' => $status === ReceiptStatus::REJECTED
                        ? $this->rejectionReason($i)
                        : null,

                'created_at' => $submittedAt,
                'updated_at' => $verifiedAt ?? $submittedAt,
            ]);
        }
    }

    private function createDraws(): void
    {
        $dates = [
            1 => Carbon::parse('2026-08-07 18:00:00'),
            2 => Carbon::parse('2026-08-14 18:00:00'),
            3 => Carbon::parse('2026-08-21 18:00:00'),
            4 => Carbon::parse('2026-08-28 18:00:00'),
            5 => Carbon::parse('2026-09-04 18:00:00'),
        ];

        foreach ($dates as $week => $drawDate) {
            $status = match ($week) {
                1, 2 => DrawStatus::COMPLETED,
                3 => DrawStatus::SCHEDULED,
                default => DrawStatus::DRAFT,
            };

            $draw = Draw::create([
                'week_number' => $week,
                'draw_date' => $drawDate,
                'status' => $status,
                'created_by' => $this->admin->id,
            ]);

            $drawPrizes = $this->allocateWeeklyPrizes($draw);

            if ($week <= 2) {
                $this->seedCompletedDraw(
                    $draw,
                    $drawPrizes,
                    $drawDate
                );
            }
        }
    }

    private function allocateWeeklyPrizes(Draw $draw): array
    {
        $burn = Prize::query()
            ->where('type', 'burn')
            ->firstOrFail();

        $newBalance = Prize::query()
            ->where('type', 'new_balance_certificate')
            ->firstOrFail();

        $scooter = Prize::query()
            ->where('type', 'scooter')
            ->firstOrFail();

        return [
            DrawPrize::create([
                'draw_id' => $draw->id,
                'prize_id' => $burn->id,
                'quantity' => 100,
            ]),
            DrawPrize::create([
                'draw_id' => $draw->id,
                'prize_id' => $newBalance->id,
                'quantity' => 4,
            ]),
            DrawPrize::create([
                'draw_id' => $draw->id,
                'prize_id' => $scooter->id,
                'quantity' => 1,
            ]),
        ];
    }

    private function seedCompletedDraw(
        Draw $draw,
        array $drawPrizes,
        Carbon $drawDate
    ): void {
        $snapshotAt = (clone $drawDate)
            ->subMinutes(30);

        $alreadyWinningReceiptIds = DrawWinner::query()
            ->pluck('receipt_id');

        $eligibleReceipts = Receipt::query()
            ->where('status', ReceiptStatus::APPROVED)
            ->where('submitted_at', '<=', $snapshotAt)
            ->when(
                $alreadyWinningReceiptIds->isNotEmpty(),
                fn ($query) => $query->whereNotIn(
                    'id',
                    $alreadyWinningReceiptIds
                )
            )
            ->orderBy('id')
            ->get();

        $requiredWinners = collect($drawPrizes)
            ->sum('quantity');

        if ($eligibleReceipts->count() < $requiredWinners + 10) {
            throw new RuntimeException(
                "Not enough eligible demo receipts for Week {$draw->week_number}."
            );
        }

        $entries = [];

        foreach ($eligibleReceipts as $index => $receipt) {
            $entries[] = [
                'draw_id' => $draw->id,
                'receipt_id' => $receipt->id,
                'entry_number' => $index + 1,
                'created_at' => $snapshotAt,
                'updated_at' => $snapshotAt,
            ];
        }

        foreach (array_chunk($entries, 500) as $chunk) {
            DrawEntry::insert($chunk);
        }

        $entryNumbers = range(
            1,
            $eligibleReceipts->count()
        );

        mt_srand(20260818 + $draw->week_number);
        shuffle($entryNumbers);

        $randomizedAt = (clone $drawDate)
            ->addMinutes(2);

        $completedAt = (clone $drawDate)
            ->addMinutes(3);

        $draw->update([
            'status' => DrawStatus::COMPLETED,
            'snapshot_at' => $snapshotAt,
            'random_provider' => 'local',
            'random_request_id' => 'demo-week-'.$draw->week_number,
            'random_request' => [
                'entries' => range(
                    1,
                    $eligibleReceipts->count()
                ),
            ],
            'random_response' => [
                'values' => $entryNumbers,
            ],
            'randomized_at' => $randomizedAt,
            'completed_at' => $completedAt,
        ]);

        $entryMap = DrawEntry::query()
            ->where('draw_id', $draw->id)
            ->get()
            ->keyBy('entry_number');

        $winnerEntryNumbers = array_slice(
            $entryNumbers,
            0,
            $requiredWinners
        );

        $reserveEntryNumbers = array_slice(
            $entryNumbers,
            $requiredWinners
        );

        $winnerIndex = 0;
        $originalWinners = [];

        foreach ($drawPrizes as $drawPrize) {
            for ($i = 0; $i < $drawPrize->quantity; $i++) {
                $entryNumber =
                    $winnerEntryNumbers[$winnerIndex++];

                $entry = $entryMap[$entryNumber];

                $winner = DrawWinner::create([
                    'draw_id' => $draw->id,
                    'draw_prize_id' => $drawPrize->id,
                    'receipt_id' => $entry->receipt_id,
                    'entry_number' => $entryNumber,
                    'status' => DrawWinnerStatus::CONFIRMED,
                    'selected_at' => $randomizedAt,
                    'confirmed_at' => (clone $randomizedAt)
                        ->addHours(mt_rand(2, 36)),
                ]);

                $originalWinners[] = $winner;
            }
        }

        $cancelCount = $draw->week_number === 1
            ? 2
            : 3;

        $cancelledWinners = collect($originalWinners)
            ->shuffle()
            ->take($cancelCount);

        $reserveIndex = 0;

        foreach ($cancelledWinners as $cancelledWinner) {
            $cancelledAt = (clone $randomizedAt)
                ->addHours(mt_rand(2, 18));

            $cancelledWinner->update([
                'status' => DrawWinnerStatus::CANCELLED,
                'confirmed_at' => null,
                'cancelled_at' => $cancelledAt,
                'cancellation_reason' => 'Winner could not be confirmed after contact attempts.',
            ]);

            WinnerContactAttempt::create([
                'draw_winner_id' => $cancelledWinner->id,
                'created_by' => $this->admin->id,
                'attempted_at' => (clone $randomizedAt)
                    ->addHour(),
                'result' => ContactAttemptResult::NO_ANSWER,
                'notes' => 'First call attempt. No answer.',
            ]);

            WinnerContactAttempt::create([
                'draw_winner_id' => $cancelledWinner->id,
                'created_by' => $this->admin->id,
                'attempted_at' => (clone $randomizedAt)
                    ->addHours(4),
                'result' => ContactAttemptResult::NO_ANSWER,
                'notes' => 'Second call attempt. No answer.',
            ]);

            $replacementEntryNumber =
                $reserveEntryNumbers[$reserveIndex++];

            $replacementEntry =
                $entryMap[$replacementEntryNumber];

            $replacementSelectedAt = (clone $cancelledAt)
                ->addMinutes(10);

            $replacement = DrawWinner::create([
                'draw_id' => $draw->id,
                'draw_prize_id' => $cancelledWinner->draw_prize_id,
                'receipt_id' => $replacementEntry->receipt_id,
                'entry_number' => $replacementEntryNumber,
                'status' => DrawWinnerStatus::CONFIRMED,
                'selected_at' => $replacementSelectedAt,
                'confirmed_at' => (clone $replacementSelectedAt)
                    ->addHours(2),
                'replaced_winner_id' => $cancelledWinner->id,
            ]);

            WinnerContactAttempt::create([
                'draw_winner_id' => $replacement->id,
                'created_by' => $this->admin->id,
                'attempted_at' => (clone $replacementSelectedAt)
                    ->addHour(),
                'result' => ContactAttemptResult::CONTACTED,
                'notes' => 'Replacement winner contacted and confirmed.',
            ]);
        }

        DrawWinner::query()
            ->where('draw_id', $draw->id)
            ->where('status', DrawWinnerStatus::CONFIRMED)
            ->whereDoesntHave('contactAttempts')
            ->get()
            ->each(function (DrawWinner $winner) {
                WinnerContactAttempt::create([
                    'draw_winner_id' => $winner->id,
                    'created_by' => $this->admin->id,
                    'attempted_at' => $winner->selected_at->copy()->addHour(),
                    'result' => ContactAttemptResult::CONTACTED,
                    'notes' => 'Winner contacted and confirmed.',
                ]);
            });

        AuditLog::create([
            'user_id' => $this->admin->id,
            'action' => 'draw.snapshot_created',
            'auditable_type' => Draw::class,
            'auditable_id' => $draw->id,
            'old_values' => [
                'status' => DrawStatus::DRAFT->value,
            ],
            'new_values' => [
                'status' => DrawStatus::RUNNING->value,
                'entries_count' => $eligibleReceipts->count(),
                'required_winners' => $requiredWinners,
            ],
            'description' => 'Demo draw participant snapshot created.',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'DemoCampaignSeeder',
            'created_at' => $snapshotAt,
            'updated_at' => $snapshotAt,
        ]);

        AuditLog::create([
            'user_id' => $this->admin->id,
            'action' => 'draw.executed',
            'auditable_type' => Draw::class,
            'auditable_id' => $draw->id,
            'old_values' => [
                'status' => DrawStatus::RUNNING->value,
            ],
            'new_values' => [
                'status' => DrawStatus::COMPLETED->value,
                'entries_count' => $eligibleReceipts->count(),
                'winners_count' => $requiredWinners,
            ],
            'description' => 'Demo draw executed.',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'DemoCampaignSeeder',
            'created_at' => $completedAt,
            'updated_at' => $completedAt,
        ]);
    }

    private function createReceiptNotes(): void
    {
        Receipt::query()
            ->where(function ($query) {
                $query
                    ->where('is_suspicious', true)
                    ->orWhere(
                        'status',
                        ReceiptStatus::REJECTED
                    );
            })
            ->inRandomOrder()
            ->limit(60)
            ->get()
            ->each(function (Receipt $receipt, int $index) {
                ReceiptNote::create([
                    'receipt_id' => $receipt->id,
                    'user_id' => $this->admin->id,
                    'note' => match ($index % 4) {
                        0 => 'Receipt checked manually.',
                        1 => 'Customer data verified.',
                        2 => 'Receipt image requires additional review.',
                        default => 'Purchase details reviewed by organizer.',
                    },
                ]);
            });
    }

    private function randomDate(
        Carbon $from,
        Carbon $to
    ): Carbon {
        $timestamp = mt_rand(
            $from->timestamp,
            $to->timestamp
        );

        return Carbon::createFromTimestamp($timestamp);
    }

    private function rejectionReason(int $index): string
    {
        $reasons = [
            'Receipt information could not be verified.',
            'Receipt image is unreadable.',
            'Receipt does not meet promotion requirements.',
            'Receipt number could not be confirmed.',
            'Purchase date is outside the eligible period.',
        ];

        return $reasons[
            $index % count($reasons)
        ];
    }
}
