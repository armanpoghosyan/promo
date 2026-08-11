<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('draw_winners', function (Blueprint $table) {
            $table->foreignId('replaced_winner_id')
                ->nullable()
                ->after('cancellation_reason')
                ->constrained('draw_winners')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('draw_winners', function (Blueprint $table) {
            $table->dropForeign([
                'replaced_winner_id',
            ]);

            $table->dropColumn('replaced_winner_id');
        });
    }
};
