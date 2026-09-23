<?php

use App\Http\Controllers\XtreamCodeController;
use Illuminate\Support\Facades\Route;

Route::any('/player_api.php', [XtreamCodeController::class, 'playerApi']);
Route::any('/get.php', [XtreamCodeController::class, 'getM3u']);
Route::any('/xmltv.php', [XtreamCodeController::class, 'xmltv']);
Route::any('/live/{username}/{password}/{stream_id}.{ext}', [XtreamCodeController::class, 'streamLive']);
Route::any('/live/{username}/{password}/{stream_id}', [XtreamCodeController::class, 'streamLive']);

Route::get('/login', function () {
    return view('welcome');
})->name('login');

Route::fallback(function () {
    return view('welcome');
});
