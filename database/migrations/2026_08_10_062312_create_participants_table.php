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
       Schema::create('participants', function (Blueprint $table) {
           $table->id();

           $table->string('first_name', 100);
           $table->string('last_name', 100);

           $table->string('phone', 30);
           $table->string('email', 255);

           $table->timestamps();

           $table->index('phone');
           $table->index('email');
       });
   }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('participants');
    }
};
