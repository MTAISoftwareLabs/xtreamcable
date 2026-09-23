<?php

use App\Http\Controllers\XtreamCodeController;
use Illuminate\Http\Request;

error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    require __DIR__.'/../vendor/autoload.php';
    $app = require_once __DIR__.'/../bootstrap/app.php';
    $app->boot();

    $request = Request::capture();
    $controller = $app->make(XtreamCodeController::class);
    $response = $controller->playerApi($request);
    $response->send();
} catch (Throwable $e) {
    header('Content-Type: application/json', true, 200);
    echo json_encode([
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString(),
    ]);
}
