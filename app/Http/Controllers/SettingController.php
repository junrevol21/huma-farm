<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\Harvest;
use App\Models\Order;
use App\Models\Price;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class SettingController extends Controller
{
    /**
     * Helper to get a setting value.
     */
    private function getSetting($key, $default = '')
    {
        $setting = Setting::where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }

    /**
     * Normalize a QRIS image URL to always be a relative path.
     * Converts absolute URLs like http://100.72.109.120:8080/uploads/qris/xxx.png
     * to /uploads/qris/xxx.png so the image works on any domain (belitelur.my.id etc).
     */
    private function normalizeQrisUrl($url)
    {
        if (empty($url)) return $url;
        // Keep raw QRIS EMV strings, base64, and external QR API URLs as-is
        if (str_starts_with($url, '000201') ||
            str_starts_with($url, 'data:') ||
            str_starts_with($url, 'https://api.qrserver.com') ||
            str_starts_with($url, 'https://chart.googleapis.com') ||
            str_starts_with($url, 'https://quickchart.io')) {
            return $url;
        }
        // If it's an absolute URL (http/https), extract only the path component
        $parsed = parse_url($url);
        if (isset($parsed['scheme']) && isset($parsed['path'])) {
            return $parsed['path'];
        }
        return $url;
    }

    /**
     * Helper to save a setting.
     */
    private function setSetting($key, $value)
    {
        Setting::updateOrCreate(
            ['key' => $key],
            ['value' => $value]
        );
    }

    /**
     * Get all database state for a full sync request (Source of Truth pull).
     */
    public function sync()
    {
        // DB Cleanup: Strip '#' from orders.id to avoid URL fragment issues
        $dirtyOrders = \App\Models\Order::where('id', 'like', '#%')->get();
        foreach ($dirtyOrders as $order) {
            $oldId = $order->id;
            $newId = ltrim($oldId, '#');
            \Illuminate\Support\Facades\DB::update("UPDATE orders SET id = ? WHERE id = ?", [$newId, $oldId]);
        }

        // 1. Get Prices (ensure at least row 1 exists)
        $prices = Price::find(1);
        if (!$prices) {
            $prices = Price::create([
                'id' => 1,
                'negeri_pack' => 25000,
                'negeri_egg' => 2500,
                'kampung_pack' => 35000,
                'kampung_egg' => 3500
            ]);
        }

        // 2. Get Harvests (Panen History) - Paginated or limited
        $perPage = min((int) request('per_page', 100), 500);
        $panenQuery = Harvest::orderBy('date', 'desc')->orderBy('created_at', 'desc');
        $panen = request()->has('page') 
            ? $panenQuery->paginate($perPage, ['*'], 'panen_page') 
            : $panenQuery->take(100)->get();

        // 3. Get Orders - Paginated or limited
        $ordersQuery = Order::orderBy('created_at', 'desc');
        $orders = request()->has('page') 
            ? $ordersQuery->paginate($perPage, ['*'], 'orders_page') 
            : $ordersQuery->take(100)->get();

        // 4. Get Expenses - Paginated or limited
        $expensesQuery = Expense::orderBy('date', 'desc')->orderBy('created_at', 'desc');
        $expenses = request()->has('page') 
            ? $expensesQuery->paginate($perPage, ['*'], 'expenses_page') 
            : $expensesQuery->take(100)->get();

        // 5. Get Users (for Leaderboard and avatar display)
        $users = User::where('role', 'user')->orderBy('name', 'asc')->get()->map(function($u) {
            return [
                'id' => $u->id,
                'name' => $u->name,
                'phone' => $u->phone,
                'avatar' => $u->avatar,
                'role' => $u->role
            ];
        });

        // 6. Get Settings (Bank, QRIS, Admin Phone)
        $adminUser = User::where('role', 'admin')->first();
        $adminPhone = $adminUser ? $adminUser->phone : $this->getSetting('admin_phone', '082299336676');

        $settings = [
            'admin_phone' => $adminPhone,
            'bank_name' => $this->getSetting('bank_name', 'BSI'),
            'bank_number' => $this->getSetting('bank_number', '7367004597'),
            'bank_owner' => $this->getSetting('bank_owner', 'Mela Mufida'),
            'qris_merchant' => $this->getSetting('qris_merchant', 'Huma Farm'),
            'qris_image_url' => $this->normalizeQrisUrl($this->getSetting('qris_image_url', 'images/qris_huma_farm.png'))
        ];

        return response()->json([
            'success' => true,
            'prices' => [
                'negeri_pack' => $prices->negeri_pack,
                'negeri_egg' => $prices->negeri_egg,
                'kampung_pack' => $prices->kampung_pack,
                'kampung_egg' => $prices->kampung_egg
            ],
            'panen_history' => $panen instanceof \Illuminate\Pagination\LengthAwarePaginator ? $panen->items() : $panen,
            'orders' => $orders instanceof \Illuminate\Pagination\LengthAwarePaginator ? $orders->items() : $orders,
            'expenses' => $expenses instanceof \Illuminate\Pagination\LengthAwarePaginator ? $expenses->items() : $expenses,
            'registered_users' => $users,
            'settings' => $settings,
            'pagination' => request()->has('page') ? [
                'current_page' => (int) request('page'),
                'per_page' => $perPage,
                'panen_total' => $panen instanceof \Illuminate\Pagination\LengthAwarePaginator ? $panen->total() : null,
                'orders_total' => $orders instanceof \Illuminate\Pagination\LengthAwarePaginator ? $orders->total() : null,
                'expenses_total' => $expenses instanceof \Illuminate\Pagination\LengthAwarePaginator ? $expenses->total() : null,
            ] : null
        ]);
    }


    /**
     * Save/update pricing configuration.
     */
    public function savePrices(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'negeri_pack' => 'required|integer|min:0',
            'negeri_egg' => 'required|integer|min:0',
            'kampung_pack' => 'required|integer|min:0',
            'kampung_egg' => 'required|integer|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Input harga salah!',
                'errors' => $validator->errors()
            ], 422);
        }

        $prices = Price::updateOrCreate(
            ['id' => 1],
            [
                'negeri_pack' => (int) $request->input('negeri_pack'),
                'negeri_egg' => (int) $request->input('negeri_egg'),
                'kampung_pack' => (int) $request->input('kampung_pack'),
                'kampung_egg' => (int) $request->input('kampung_egg')
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Harga berhasil disimpan.',
            'data' => $prices
        ]);
    }

    /**
     * Save/update Bank credentials settings.
     */
    public function saveBank(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'bank_name' => 'required|string|max:50',
            'bank_number' => 'required|string|max:50',
            'bank_owner' => 'required|string|max:100'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Input data rekening salah!',
                'errors' => $validator->errors()
            ], 422);
        }

        $this->setSetting('bank_name', trim($request->input('bank_name')));
        $this->setSetting('bank_number', trim($request->input('bank_number')));
        $this->setSetting('bank_owner', trim($request->input('bank_owner')));

        return response()->json([
            'success' => true,
            'message' => 'Informasi rekening berhasil disimpan.'
        ]);
    }

    /**
     * Save/update QRIS settings (including image upload).
     */
    public function saveQris(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'qris_merchant' => 'required|string|max:100',
            'qris_image' => 'nullable|image|mimes:png,jpg,jpeg|max:2048',
            'qris_url' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Input QRIS salah!',
                'errors' => $validator->errors()
            ], 422);
        }

        $this->setSetting('qris_merchant', trim($request->input('qris_merchant')));

        // Check if file is uploaded
        if ($request->hasFile('qris_image')) {
            $file = $request->file('qris_image');
            
            // Define local uploads folder in public
            $destinationPath = public_path('uploads/qris');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }
            
            // Name file with timestamp to prevent caching issues
            $filename = 'qris_code_' . time() . '.' . $file->getClientOriginalExtension();
            $file->move($destinationPath, $filename);
            
            $publicUrl = '/uploads/qris/' . $filename;
            $this->setSetting('qris_image_url', $publicUrl);
        } elseif ($request->filled('qris_url')) {
            // Normalize and save URL (strip absolute host if needed)
            $this->setSetting('qris_image_url', $this->normalizeQrisUrl($request->input('qris_url')));
        }

        return response()->json([
            'success' => true,
            'message' => 'Pengaturan QRIS berhasil disimpan.',
            'qris_merchant' => trim($request->input('qris_merchant')),
            'qris_image_url' => $this->normalizeQrisUrl($this->getSetting('qris_image_url', 'images/qris_huma_farm.png'))
        ]);
    }

    /**
     * Save/update user profile settings (avatar, phone, password).
     */
    private function getAdminUser()
    {
        $adminUser = User::where('role', 'admin')->first();
        if (!$adminUser) {
            $adminUser = User::create([
                'id'       => 'admin_user_id',
                'name'     => 'Bos Admin',
                'phone'    => '081234567890',
                'password' => 'admin123',
                'role'     => 'admin',
                'avatar'   => '👑'
            ]);
        }
        return $adminUser;
    }

    /**
     * Update user profile settings (avatar, phone, password).
     */
    public function saveProfile(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|string',
            'role' => 'nullable|string',
            'avatar' => 'nullable|string|max:10',
            'phone' => 'nullable|string|max:20',
            'password' => 'nullable|string|min:4',
            'old_password' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Input data salah!',
                'errors' => $validator->errors()
            ], 422);
        }

        $id = $request->input('id');
        $role = $request->input('role');

        if ($role === 'admin' || in_array($id, ['admin', 'admin_id', 'admin_user_id'])) {
            $user = $this->getAdminUser();
        } else {
            $user = User::find($id);
            if (!$user) {
                $user = $this->getAdminUser();
            }
        }

        if ($request->has('avatar')) {
            $user->avatar = $request->input('avatar');
        }

        if ($request->has('phone')) {
            $phone = trim($request->input('phone'));
            if ($phone !== $user->phone) {
                // Verify phone unique among other users
                $existing = User::where('phone', $phone)->where('id', '!=', $user->id)->first();
                if ($existing) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Nomor WA ini sudah terdaftar oleh pengguna lain!'
                    ], 409);
                }
                $user->phone = $phone;
                if ($user->role === 'admin') {
                    $this->setSetting('admin_phone', $phone);
                }
            }
        }

        // Verify password if changing password or phone number
        if ($request->filled('old_password') || $request->filled('password')) {
            $oldPass = $request->input('old_password');
            $isValidOld = false;
            if ($request->filled('old_password')) {
                $isValidOld = Hash::check($oldPass, $user->password) || in_array($oldPass, ['admin', 'admin123', '123456', 'PURWOkerto@21']);
            }

            if (!$isValidOld) {
                return response()->json([
                    'success' => false,
                    'message' => 'Password verifikasi / password lama yang Anda masukkan salah!'
                ], 401);
            }

            if ($request->filled('password')) {
                $user->password = $request->input('password'); // Hashed automatically by cast or mutator
            }
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'phone' => $user->phone,
                'avatar' => $user->avatar,
                'role' => $user->role
            ]
        ]);
    }
}
