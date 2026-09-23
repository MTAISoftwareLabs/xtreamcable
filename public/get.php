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
    $response = $controller->getM3u($request);
    $response->send();
} catch (Throwable $e) {
    header('Content-Type: text/plain', true, 200);
    echo "#EXTM3U\n#ERROR: ".$e->getMessage()."\n";
}
