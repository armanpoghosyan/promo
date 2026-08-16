<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('winner_contact_attempts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('draw_winner_id')
                ->constrained('draw_winners')
                ->cascadeOnDelete();

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('attempted_at');

            $table->string('result', 50);

            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index('attempted_at');
            $table->index('result');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('winner_contact_attempts');
    }
};
