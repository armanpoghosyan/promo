<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('action', 100);

            /*
             * The model/table that was changed.
             * Examples:
             * Receipt
             * Winner
             * Draw
             * Prize
             */
            $table->string('auditable_type', 100)->nullable();

            $table->unsignedBigInteger('auditable_id')->nullable();

            /*
             * State before and after the action.
             */
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();

            /*
             * Additional information.
             */
            $table->text('description')->nullable();

            $table->ipAddress('ip_address')->nullable();

            $table->string('user_agent', 500)->nullable();

            $table->timestamps();

            $table->index([
                'auditable_type',
                'auditable_id',
            ]);

            $table->index('action');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
