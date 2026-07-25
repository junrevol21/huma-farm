<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add performance indexes to frequently queried columns.
     */
    public function up(): void
    {
        // panen_history: type is used in every stock calculation (SUM WHERE type='add'/'sub')
        Schema::table('panen_history', function (Blueprint $table) {
            $table->index('type', 'idx_panen_type');
            $table->index('date', 'idx_panen_date');
        });

        // orders: category & payment_status are used heavily in stock calculation & filtering
        Schema::table('orders', function (Blueprint $table) {
            $table->index('category', 'idx_orders_category');
            $table->index('payment_status', 'idx_orders_payment_status');
            $table->index('status', 'idx_orders_status');
            $table->index('created_at', 'idx_orders_created_at');
        });

        // expenses: date is used for filtering & ordering
        Schema::table('expenses', function (Blueprint $table) {
            $table->index('date', 'idx_expenses_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('panen_history', function (Blueprint $table) {
            $table->dropIndex('idx_panen_type');
            $table->dropIndex('idx_panen_date');
        });
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('idx_orders_category');
            $table->dropIndex('idx_orders_payment_status');
            $table->dropIndex('idx_orders_status');
            $table->dropIndex('idx_orders_created_at');
        });
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropIndex('idx_expenses_date');
        });
    }
};
