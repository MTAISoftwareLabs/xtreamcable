<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ContentCategoryController;
use App\Http\Controllers\ContentItemController;
use App\Http\Controllers\CreditController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EpgScheduleController;
use App\Http\Controllers\IntegrationController;
use App\Http\Controllers\PackageController;
use App\Http\Controllers\ResellerController;
use App\Http\Controllers\ServerController;
use App\Http\Controllers\StreamSourceController;
use App\Http\Controllers\SubscriberController;
use App\Http\Controllers\UserGroupController;
use App\Http\Middleware\EnsureConsoleAuthenticated;
use App\Http\Middleware\EnsureMasterAdmin;
use Illuminate\Support\Facades\Route;

Route::middleware('web')->group(function () {
    Route::get('/session', [AuthController::class, 'session']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::middleware(EnsureConsoleAuthenticated::class)->group(function () {
        Route::get('/health', [DashboardController::class, 'health']);
        Route::get('/bootstrap', [DashboardController::class, 'bootstrap']);
        Route::get('/activity', [DashboardController::class, 'activity']);
        Route::get('/settings', [DashboardController::class, 'settings']);
        Route::patch('/settings', [DashboardController::class, 'updateSettings']);

        Route::apiResource('users', SubscriberController::class);
        Route::get('/credits', [CreditController::class, 'index']);

        // Master-only routes
        Route::middleware(EnsureMasterAdmin::class)->group(function () {
            Route::apiResource('groups', UserGroupController::class);
            Route::apiResource('packages', PackageController::class);
            Route::apiResource('servers', ServerController::class);
            Route::apiResource('sources', StreamSourceController::class);
            Route::apiResource('categories', ContentCategoryController::class);
            Route::apiResource('epg', EpgScheduleController::class);
            Route::apiResource('resellers', ResellerController::class);
            Route::apiResource('content', ContentItemController::class);

            Route::post('/credits/issue', [CreditController::class, 'issue']);
            Route::post('/credits/transfer', [CreditController::class, 'transfer']);

            Route::get('/integrations', [IntegrationController::class, 'index']);
            Route::patch('/integrations/{integration}', [IntegrationController::class, 'update']);
            Route::post('/integrations/{integration}/test', [IntegrationController::class, 'test']);
        });
    });
});
