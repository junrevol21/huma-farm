<?php

namespace Database\Seeders;

use App\Models\Price;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        Price::updateOrCreate(
            ['id' => 1],
            [
                'negeri_pack' => 25000,
                'negeri_egg' => 2500,
                'kampung_pack' => 35000,
                'kampung_egg' => 3500
            ]
        );

        User::updateOrCreate(
            ['phone' => '081234567890'],
            [
                'id' => 'u_admin',
                'name' => 'Bos Admin',
                'password' => 'admin123',
                'role' => 'admin',
                'avatar' => '👑'
            ]
        );
    }
}
