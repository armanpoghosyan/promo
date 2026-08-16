<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('draw_winners', function (Blueprint $table) {
            $table->id();

            $table->foreignId('draw_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('draw_prize_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('receipt_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->unsignedInteger('entry_number');

            $table->string('status', 30)
                ->default('selected');

            $table->timestamp('selected_at');
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();

            $table->text('cancellation_reason')->nullable();

            $table->foreignId('replaced_winner_id')
                ->nullable()
                ->constrained('draw_winners')
                ->nullOnDelete();

            $table->timestamps();

            $table->index([
                'draw_id',
                'status',
            ]);

            $table->index('receipt_id');
            $table->index('entry_number');

            $table->unique([
                'draw_id',
                'entry_number',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('draw_winners');
    }
};
