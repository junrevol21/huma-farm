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
        Schema::create('orders', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->integer('po_number')->nullable();
            $table->string('buyer_name');
            $table->string('buyer_phone')->nullable();
            $table->string('category'); // 'negeri' | 'kampung'
            $table->string('unit'); // 'pack' | 'egg'
            $table->integer('qty');
            $table->integer('total_eggs');
            $table->decimal('total_price', 12, 2);
            $table->string('status')->default('pending_confirm'); // 'pending_confirm' | 'po' | 'completed'
            $table->integer('shortage_eggs')->default(0);
            $table->string('payment_status')->default('Menunggu Konfirmasi'); // 'Lunas' | 'Menunggu Konfirmasi' | 'Belum Bayar' | 'Batal'
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
