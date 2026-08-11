<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('winner_contact_attempts', function (Blueprint $table) {
            $table->dropForeign('winner_contact_attempts_winner_id_foreign');
        });

        Schema::table('winner_contact_attempts', function (Blueprint $table) {
            $table->foreign('draw_winner_id')
                ->references('id')
                ->on('draw_winners')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('winner_contact_attempts', function (Blueprint $table) {
            $table->dropForeign([
                'draw_winner_id',
            ]);

            $table->foreign('draw_winner_id')
                ->references('id')
                ->on('winners')
                ->cascadeOnDelete();
        });
    }
};
