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
        Schema::create('panen_history', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('type')->default('add'); // 'add' (Panen) | 'sub' (Pengurangan)
            $table->integer('negeri')->default(0);
            $table->integer('kampung')->default(0);
            $table->date('date');
            $table->string('reason')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('panen_history');
    }
};
