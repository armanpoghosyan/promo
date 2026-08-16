<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('receipts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('participant_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('receipt_number', 100);

            $table->string('receipt_image');
            $table->string('image_hash', 64)->nullable();

            $table->string('status', 30)
                ->default('submitted');

            $table->boolean('is_suspicious')
                ->default(false);

            $table->json('suspicious_reasons')
                ->nullable();

            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('verified_at')->nullable();

            $table->foreignId('verified_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->text('rejection_reason')->nullable();

            $table->timestamps();

            $table->index('receipt_number');
            $table->index('image_hash');
            $table->index('status');
            $table->index('is_suspicious');
            $table->index('submitted_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('receipts');
    }
};
