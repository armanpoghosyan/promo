<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('winner_contact_attempts', function (Blueprint $table) {
            $table->renameColumn(
                'winner_id',
                'draw_winner_id'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('winner_contact_attempts', function (Blueprint $table) {
            $table->renameColumn(
                'draw_winner_id',
                'winner_id'
            );
        });
    }
};
