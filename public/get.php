<?php

use App\Http\Controllers\XtreamCodeController;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Http\Request;

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';

$kernel = $app->make(Kernel::class);

$request = Request::capture();
$controller = $app->make(XtreamCodeController::class);

$response = $controller->getM3u($request);
$response->send();
