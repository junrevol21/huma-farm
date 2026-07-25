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
        Schema::create('prices', function (Blueprint $table) {
            $table->integer('id')->primary()->default(1);
            $table->integer('negeri_pack')->default(25000);
            $table->integer('negeri_egg')->default(2500);
            $table->integer('kampung_pack')->default(35000);
            $table->integer('kampung_egg')->default(3500);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('prices');
    }
};
