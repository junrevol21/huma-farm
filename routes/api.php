<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\HarvestController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\SettingController;
use Illuminate\Support\Facades\Route;

// -------------------------------------------------------
// PUBLIC ROUTES — accessible by anyone (visitor, user, admin)
// -------------------------------------------------------

// Auth
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

Route::get('/sync', [SettingController::class, 'sync']);

// Paginated list endpoints — for lazy loading & large datasets
Route::get('/panen',    [HarvestController::class, 'index']);   // ?page=1&per_page=50
Route::get('/orders',   [OrderController::class, 'index']);     // ?page=1&per_page=50&month=YYYY-MM
Route::get('/expenses', [ExpenseController::class, 'index']);   // ?page=1&per_page=50

// Place order — user & visitor can submit orders (no token needed)
Route::post('/orders', [OrderController::class, 'store']);

// Update own order (user may confirm payment)
Route::put('/orders/{id}', [OrderController::class, 'update']);

// Update profile — authenticated users only (verified by user ID + old_password inside controller)
Route::post('/settings/profile', [SettingController::class, 'saveProfile']);

// -------------------------------------------------------
// ADMIN-ONLY ROUTES — requires X-Admin-Token header
// -------------------------------------------------------
Route::middleware('admin.token')->group(function () {

    // Token validity check — used by frontend session checker
    Route::get('/auth/check', [AuthController::class, 'check']);

    // Panen (harvest) management
    Route::post('/panen', [HarvestController::class, 'store']);
    Route::delete('/panen/{id}', [HarvestController::class, 'destroy']);

    // Order management (cancel/delete)
    Route::delete('/orders/{id}', [OrderController::class, 'destroy']);

    // Expense management
    Route::post('/expenses', [ExpenseController::class, 'store']);
    Route::put('/expenses/{id}', [ExpenseController::class, 'update']);
    Route::delete('/expenses/{id}', [ExpenseController::class, 'destroy']);

    // Settings — prices, bank, qris, egg trooper
    Route::post('/settings/prices', [SettingController::class, 'savePrices']);
    Route::post('/settings/bank',   [SettingController::class, 'saveBank']);
    Route::post('/settings/qris',   [SettingController::class, 'saveQris']);
    Route::post('/settings/egg-trooper', [SettingController::class, 'saveEggTrooper']);
});
