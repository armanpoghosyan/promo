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
        Schema::create('draw_prizes', function (Blueprint $table) {
           $table->id();

           $table->foreignId('draw_id')
               ->constrained()
               ->cascadeOnDelete();

           $table->foreignId('prize_id')
               ->constrained()
               ->cascadeOnDelete();

           $table->unsignedInteger('quantity');

           $table->timestamps();

           $table->unique([
               'draw_id',
               'prize_id',
           ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('draw_prizes');
    }
};
