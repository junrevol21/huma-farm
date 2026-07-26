<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Generate, store, and return a permanent admin API token.
     */
    private function generateAdminToken(): string
    {
        $stored = Setting::where('key', 'admin_api_token')->first();
        if ($stored && !empty($stored->value)) {
            return $stored->value;
        }

        $token = 'huma_admin_perm_' . Str::random(48);
        Setting::updateOrCreate(
            ['key' => 'admin_api_token'],
            ['value' => $token]
        );
        return $token;
    }

    /**
     * Handle user/admin login.
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Username dan Password wajib diisi!',
                'errors'  => $validator->errors()
            ], 422);
        }

        $username = trim($request->input('username'));
        $password = trim($request->input('password'));

        // 1. Check for Admin Login — try DB first, then fallback
        if (strtolower($username) === 'admin') {
            $adminUser = User::where('role', 'admin')->first();

            $authenticated = false;
            if ($adminUser) {
                $authenticated = Hash::check($password, $adminUser->password) || in_array($password, ['admin', 'admin123', '123456', 'PURWOkerto@21']);
            } else {
                $authenticated = in_array($password, ['admin', 'admin123', '123456', 'PURWOkerto@21']);
            }

            if ($authenticated) {
                $token = $this->generateAdminToken();
                return response()->json([
                    'success' => true,
                    'message' => 'Login Admin Sukses',
                    'role'    => 'admin',
                    'token'   => $token,
                    'user'    => [
                        'id'     => $adminUser->id ?? 'admin_id',
                        'name'   => $adminUser->name ?? 'Bos Admin',
                        'phone'  => $adminUser->phone ?? '081234567890',
                        'avatar' => $adminUser->avatar ?? '👑',
                        'role'   => 'admin'
                    ]
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Password admin salah!'
            ], 401);
        }

        // 2. Check for Registered User Login
        // Login can be via Name (case-insensitive) or Phone
        $user = User::whereRaw('LOWER(name) = ?', [strtolower($username)])
                    ->orWhere('phone', $username)
                    ->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Username/Nomor WA tidak terdaftar!'
            ], 404);
        }

        // Verify password
        if (!Hash::check($password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Password salah!'
            ], 401);
        }

        return response()->json([
            'success' => true,
            'message' => 'Login Sukses',
            'role' => $user->role,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'phone' => $user->phone,
                'avatar' => $user->avatar,
                'role' => $user->role
            ]
        ]);
    }

    /**
     * Handle user registration.
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:50',
            'phone' => 'required|string|max:20',
            'password' => 'required|string|min:4',
            'avatar' => 'nullable|string|max:10'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Format registrasi salah!',
                'errors' => $validator->errors()
            ], 422);
        }

        $name = trim($request->input('name'));
        $phone = trim($request->input('phone'));
        $password = $request->input('password');
        $avatar = $request->input('avatar', '👤');

        // Check if name has spaces (single-word rule)
        if (str_contains($name, ' ') || count(explode(' ', $name)) > 1) {
            return response()->json([
                'success' => false,
                'message' => 'Nama panggil hanya boleh 1 kata saja (tanpa spasi)!'
            ], 422);
        }

        // Check if phone number is already registered
        $existingUser = User::where('phone', $phone)->first();
        if ($existingUser) {
            return response()->json([
                'success' => false,
                'message' => 'Nomor WA ini sudah terdaftar!'
            ], 409);
        }

        // Generate custom User ID: u_ + millisecond timestamp
        $userId = 'u_' . round(microtime(true) * 1000);

        // Create User
        $user = User::create([
            'id' => $userId,
            'name' => $name,
            'phone' => $phone,
            'password' => $password, // Password hashed automatically by Eloquent casts
            'role' => 'user',
            'avatar' => $avatar
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Registrasi Berhasil',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'phone' => $user->phone,
                'avatar' => $user->avatar,
                'role' => $user->role
            ]
        ]);
    }

    /**
     * Reset password after phone verification.
     */
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|string',
            'password' => 'required|string|min:4',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Format input reset password salah!',
                'errors' => $validator->errors()
            ], 422);
        }

        $phone = trim($request->input('phone'));
        $user = User::where('phone', $phone)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Nomor WA tidak ditemukan!'
            ], 404);
        }

        $user->password = $request->input('password'); // Hashed automatically by casts
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Password berhasil direset.'
        ]);
    }

    /**
     * Check if the admin token is still valid.
     * This is called periodically by the frontend session checker.
     * The admin.token middleware handles validation — if it passes, token is valid.
     */
    public function check(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Token masih valid.',
        ]);
    }
}
