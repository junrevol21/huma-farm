<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add soft deletes (deleted_at) to prevent permanent data loss.
     * Records will be hidden (not truly deleted) allowing recovery.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->softDeletes(); // adds deleted_at TIMESTAMP NULL
        });

        Schema::table('panen_history', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('expenses', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
        Schema::table('panen_history', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
