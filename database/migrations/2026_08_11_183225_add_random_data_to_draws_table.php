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
        Schema::table('draws', function (Blueprint $table) {
            $table->string('random_provider', 50)
                ->nullable()
                ->after('snapshot_at');

            $table->string('random_request_id', 150)
                ->nullable()
                ->after('random_provider');

            $table->json('random_request')
                ->nullable()
                ->after('random_request_id');

            $table->json('random_response')
                ->nullable()
                ->after('random_request');

            $table->timestamp('randomized_at')
                ->nullable()
                ->after('random_response');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('draws', function (Blueprint $table) {
            $table->dropColumn('random_provider');
            $table->dropColumn('random_request_id');
            $table->dropColumn('random_request');
            $table->dropColumn('random_response');
            $table->dropColumn('randomized_at');
        });
    }
};
