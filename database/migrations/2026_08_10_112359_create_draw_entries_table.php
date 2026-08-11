<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('draw_entries', function (Blueprint $table) {
            $table->id();

            $table->foreignId('draw_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('receipt_id')
                ->constrained()
                ->restrictOnDelete();

            /*
             * Position assigned to the receipt
             * in this particular draw snapshot.
             */
            $table->unsignedInteger('entry_number');

            $table->timestamp('created_at')->useCurrent();

            $table->unique([
                'draw_id',
                'receipt_id',
            ]);

            $table->unique([
                'draw_id',
                'entry_number',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('draw_entries');
    }
};
