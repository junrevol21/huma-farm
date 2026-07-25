<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminApiAuth
{
    /**
     * Protect admin-only routes by validating X-Admin-Token header.
     * Token is generated on login and stored in the settings table.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->header('X-Admin-Token');

        if (!$token) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Token admin diperlukan.',
                'error'   => 'MISSING_TOKEN'
            ], 401);
        }

        // Validate against stored token in settings
        $stored = Setting::where('key', 'admin_api_token')->first();

        if (!$stored || !hash_equals($stored->value, $token)) {
            return response()->json([
                'success' => false,
                'message' => 'Token tidak valid atau sudah kadaluarsa. Silakan login ulang.',
                'error'   => 'INVALID_TOKEN'
            ], 403);
        }

        return $next($request);
    }
}

