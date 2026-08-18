<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('draw_winners', function (Blueprint $table) {
            $table->unique('replaced_winner_id');

            $table->dropForeign(['draw_prize_id']);

            $table->foreign('draw_prize_id')
                ->references('id')
                ->on('draw_prizes')
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('draw_winners', function (Blueprint $table) {
            $table->dropUnique(['replaced_winner_id']);

            $table->dropForeign(['draw_prize_id']);

            $table->foreign('draw_prize_id')
                ->references('id')
                ->on('draw_prizes')
                ->cascadeOnDelete();
        });
    }
};
