<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('winners', function (Blueprint $table) {
            $table->id();

            $table->foreignId('draw_id')
                ->constrained()
                ->restrictOnDelete();

            $table->foreignId('receipt_id')
                ->constrained()
                ->restrictOnDelete();

            $table->foreignId('prize_id')
                ->constrained()
                ->restrictOnDelete();

            $table->string('status', 30)
                ->default('pending');

            $table->timestamp('selected_at');

            $table->timestamp('confirmed_at')->nullable();

            $table->timestamp('cancelled_at')->nullable();

            $table->text('cancellation_reason')->nullable();

            /*
             * If this winner replaces another winner,
             * we keep the relationship between them.
             */
            $table->foreignId('replaced_winner_id')
                ->nullable()
                ->constrained('winners')
                ->nullOnDelete();

            $table->timestamps();

            $table->index('status');
            $table->index('selected_at');
            $table->timestamp('confirmation_deadline');

            $table->unique([
                'draw_id',
                'receipt_id',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('winners');
    }
};
