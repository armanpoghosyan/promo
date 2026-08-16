<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('draws', function (Blueprint $table) {
            $table->id();

            $table->unsignedTinyInteger('week_number');
            $table->timestamp('draw_date');

            $table->string('status', 30)
                ->default('draft');

            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('snapshot_at')->nullable();

            $table->string('random_provider', 50)->nullable();
            $table->string('random_request_id', 150)->nullable();

            $table->json('random_request')->nullable();
            $table->json('random_response')->nullable();

            $table->timestamp('randomized_at')->nullable();

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();

            $table->unique('week_number');

            $table->index('status');
            $table->index('draw_date');
            $table->index('snapshot_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('draws');
    }
};
