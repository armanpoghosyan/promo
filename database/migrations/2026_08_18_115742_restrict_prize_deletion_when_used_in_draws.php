<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('draw_prizes', function (Blueprint $table) {
            $table->dropForeign(['prize_id']);

            $table->foreign('prize_id')
                ->references('id')
                ->on('prizes')
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('draw_prizes', function (Blueprint $table) {
            $table->dropForeign(['prize_id']);

            $table->foreign('prize_id')
                ->references('id')
                ->on('prizes')
                ->cascadeOnDelete();
        });
    }
};
