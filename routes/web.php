<?php

use App\Http\Controllers\XtreamCodeController;
use Illuminate\Support\Facades\Route;

Route::get('/player_api.php', [XtreamCodeController::class, 'playerApi']);
Route::get('/get.php', [XtreamCodeController::class, 'getM3u']);
Route::get('/xmltv.php', [XtreamCodeController::class, 'xmltv']);
Route::get('/live/{username}/{password}/{stream_id}.{ext}', [XtreamCodeController::class, 'streamLive']);
Route::get('/live/{username}/{password}/{stream_id}', [XtreamCodeController::class, 'streamLive']);

Route::get('/login', function () {
    return view('welcome');
})->name('login');

Route::get('/{any}', function () {
    return view('welcome');
})->where('any', '.*');
