<?php

use App\Http\Controllers\XtreamCodeController;
use App\Models\Subscriber;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;

Route::any('/test_api', [XtreamCodeController::class, 'playerApi']);
Route::any('/player_api.php', [XtreamCodeController::class, 'playerApi']);
Route::any('/public/player_api.php', [XtreamCodeController::class, 'playerApi']);
Route::any('/player_api', [XtreamCodeController::class, 'playerApi']);
Route::any('/public/player_api', [XtreamCodeController::class, 'playerApi']);

Route::any('/get.php', [XtreamCodeController::class, 'getM3u']);
Route::any('/public/get.php', [XtreamCodeController::class, 'getM3u']);
Route::any('/get', [XtreamCodeController::class, 'getM3u']);
Route::any('/public/get', [XtreamCodeController::class, 'getM3u']);

Route::any('/xmltv.php', [XtreamCodeController::class, 'xmltv']);
Route::any('/public/xmltv.php', [XtreamCodeController::class, 'xmltv']);
Route::any('/xmltv', [XtreamCodeController::class, 'xmltv']);
Route::any('/public/xmltv', [XtreamCodeController::class, 'xmltv']);

Route::any('/live/{username}/{password}/{stream_id}.{ext}', [XtreamCodeController::class, 'streamLive']);
Route::any('/public/live/{username}/{password}/{stream_id}.{ext}', [XtreamCodeController::class, 'streamLive']);
Route::any('/live/{username}/{password}/{stream_id}', [XtreamCodeController::class, 'streamLive']);
Route::any('/public/live/{username}/{password}/{stream_id}', [XtreamCodeController::class, 'streamLive']);

Route::get('/debug_subs', function () {
    try {
        $columns = Schema::getColumnListing('subscribers');
        $subs = Subscriber::all();

        return response()->json([
            'columns' => $columns,
            'subscribers' => $subs,
        ]);
    } catch (Throwable $e) {
        return response()->json([
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ], 500);
    }
});

Route::get('/login', function () {
    return view('welcome');
})->name('login');

Route::fallback(function () {
    return view('welcome');
});
