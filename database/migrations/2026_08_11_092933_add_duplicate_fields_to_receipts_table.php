<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('receipts', function (Blueprint $table) {
            $table->boolean('is_suspicious')
                ->default(false)
                ->after('status');

            $table->json('suspicious_reasons')
                ->nullable()
                ->after('is_suspicious');

            $table->string('image_hash', 64)
                ->nullable()
                ->after('receipt_image');

            $table->index('image_hash');
            $table->index('is_suspicious');
        });
    }

    public function down(): void
    {
        Schema::table('receipts', function (Blueprint $table) {
            $table->dropIndex(['image_hash']);
            $table->dropIndex(['is_suspicious']);

            $table->dropColumn([
                'is_suspicious',
                'suspicious_reasons',
                'image_hash',
            ]);
        });
    }
};
