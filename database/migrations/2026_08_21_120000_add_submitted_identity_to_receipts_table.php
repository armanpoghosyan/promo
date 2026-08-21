<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('receipts', function (Blueprint $table) {
            $table->string('submitted_first_name', 100)
                ->nullable()
                ->after('participant_id');
            $table->string('submitted_last_name', 100)
                ->nullable()
                ->after('submitted_first_name');
            $table->string('submitted_phone', 30)
                ->nullable()
                ->after('submitted_last_name');
            $table->string('submitted_email')
                ->nullable()
                ->after('submitted_phone');
        });
    }

    public function down(): void
    {
        Schema::table('receipts', function (Blueprint $table) {
            $table->dropColumn([
                'submitted_first_name',
                'submitted_last_name',
                'submitted_phone',
                'submitted_email',
            ]);
        });
    }
};
