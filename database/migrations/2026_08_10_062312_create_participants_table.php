<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('participants', function (Blueprint $table) {
            $table->id();

            $table->string('first_name', 100);
            $table->string('last_name', 100);

            $table->string('phone', 30);
            $table->string('phone_normalized', 30);

            $table->string('email', 255);
            $table->string('email_normalized', 255);

            $table->timestamps();

            $table->index('phone_normalized');
            $table->index('email_normalized');

            $table->unique([
                'phone_normalized',
                'email_normalized',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('participants');
    }
};
