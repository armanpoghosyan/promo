<?php

namespace Tests\Feature;

use App\Enums\DrawStatus;
use App\Enums\ReceiptStatus;
use App\Models\Draw;
use App\Models\DrawEntry;
use App\Models\DrawPrize;
use App\Models\Participant;
use App\Models\Prize;
use App\Models\Receipt;
use App\Models\User;
use App\Services\CampaignWindowService;
use App\Services\DrawService;
use App\Services\ReceiptSubmissionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Tests\TestCase;

class ReceiptWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_submission_preserves_identity_and_flags_name_mismatch(): void
    {
        Storage::fake('private');

        $participant = Participant::factory()->create([
            'first_name' => 'Aram',
            'last_name' => 'Petrosyan',
            'phone' => '+37499111222',
            'phone_normalized' => '37499111222',
            'email' => 'aram@example.com',
            'email_normalized' => 'aram@example.com',
        ]);

        $receipt = app(ReceiptSubmissionService::class)->submit(
            participantData: [
                'first_name' => 'Ani',
                'last_name' => 'Petrosyan',
                'phone' => '099 111 222',
                'email' => 'ARAM@example.com',
            ],
            receiptNumber: '0012345',
            receiptImage: UploadedFile::fake()->image('receipt.jpg')
        );

        $this->assertSame($participant->id, $receipt->participant_id);
        $this->assertSame('0012345', $receipt->receipt_number);
        $this->assertSame('Ani', $receipt->submitted_first_name);
        $this->assertSame('099 111 222', $receipt->submitted_phone);
        $this->assertTrue($receipt->is_suspicious);
        $this->assertContains(
            'participant_name_mismatch',
            $receipt->suspicious_reasons
        );
    }

    public function test_suspicious_receipt_requires_note_for_permanent_approval(): void
    {
        $user = User::factory()->create();
        $receipt = Receipt::factory()->create([
            'is_suspicious' => true,
            'suspicious_reasons' => ['duplicate_receipt_number'],
        ]);

        $this->actingAs($user)
            ->postJson("/api/admin/receipts/{$receipt->id}/approve")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('review_note');

        $this->actingAs($user)
            ->postJson("/api/admin/receipts/{$receipt->id}/approve", [
                'review_note' => 'Verified against the original receipt image.',
            ])
            ->assertOk();

        $this->assertDatabaseHas('receipts', [
            'id' => $receipt->id,
            'status' => ReceiptStatus::APPROVED->value,
        ]);
        $this->assertDatabaseHas('receipt_notes', [
            'receipt_id' => $receipt->id,
            'user_id' => $user->id,
            'note' => 'Verified against the original receipt image.',
        ]);
    }

    public function test_receipt_review_returns_matching_duplicate_evidence(): void
    {
        $user = User::factory()->create();
        $original = Receipt::factory()->create([
            'receipt_number' => '000123',
            'image_hash' => str_repeat('a', 64),
        ]);
        $duplicate = Receipt::factory()->create([
            'receipt_number' => '000123',
            'image_hash' => str_repeat('a', 64),
            'is_suspicious' => true,
            'suspicious_reasons' => [
                'duplicate_receipt_number',
                'duplicate_receipt_image',
            ],
        ]);

        $this->actingAs($user)
            ->getJson("/api/admin/receipts/{$duplicate->id}")
            ->assertOk()
            ->assertJsonPath('data.duplicate_matches.0.id', $original->id)
            ->assertJsonPath(
                'data.duplicate_matches.0.matched_by',
                ['receipt_number', 'receipt_image']
            );
    }

    public function test_campaign_window_blocks_early_submissions(): void
    {
        config([
            'campaign.start_at' => now()->addDay()->toISOString(),
            'campaign.end_at' => now()->addDays(2)->toISOString(),
        ]);

        $status = app(CampaignWindowService::class)->submissionStatus();

        $this->assertFalse($status['open']);
        $this->assertSame(422, $status['status']);
        $this->assertSame(
            'The campaign has not started yet.',
            $status['message']
        );
    }

    public function test_draw_cannot_execute_before_its_scheduled_date(): void
    {
        $user = User::factory()->create();
        $receipt = Receipt::factory()->create([
            'status' => ReceiptStatus::APPROVED,
        ]);
        $prize = Prize::create([
            'name' => 'Test Prize',
            'type' => 'burn',
            'total_quantity' => 1,
        ]);
        $draw = Draw::create([
            'week_number' => 1,
            'draw_date' => now()->addHour(),
            'status' => DrawStatus::RUNNING,
            'snapshot_at' => now(),
            'created_by' => $user->id,
        ]);

        DrawPrize::create([
            'draw_id' => $draw->id,
            'prize_id' => $prize->id,
            'quantity' => 1,
        ]);
        DrawEntry::create([
            'draw_id' => $draw->id,
            'receipt_id' => $receipt->id,
            'entry_number' => 1,
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage(
            'This draw cannot be executed before its scheduled date.'
        );

        app(DrawService::class)->execute($draw, $user->id);
    }
}
