<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('draw_winners', function (Blueprint $table) {
            $table->unique(
                'receipt_id',
                'draw_winners_receipt_id_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::table('draw_winners', function (Blueprint $table) {
            $table->dropUnique(
                'draw_winners_receipt_id_unique'
            );
        });
    }
};
