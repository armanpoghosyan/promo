<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('participants', function (Blueprint $table) {
            $table->timestamp('privacy_policy_accepted_at')
                ->nullable();

            $table->timestamp('official_rules_accepted_at')
                ->nullable();

            $table->timestamp('personal_data_consent_at')
                ->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('participants', function (Blueprint $table) {
            $table->dropColumn([
                'privacy_policy_accepted_at',
                'official_rules_accepted_at',
                'personal_data_consent_at',
            ]);
        });
    }
};
