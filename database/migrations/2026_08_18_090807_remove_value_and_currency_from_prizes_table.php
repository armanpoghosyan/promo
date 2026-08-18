<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('prizes', function (Blueprint $table) {
            $table->dropColumn([
                'value',
                'currency',
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('prizes', function (Blueprint $table) {
            $table->decimal('value', 12, 2)->nullable();
            $table->string('currency', 3)->nullable();
        });
    }
};
