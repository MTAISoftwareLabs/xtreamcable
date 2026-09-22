<?php

use App\Http\Controllers\AuthController;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Http\Request;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

try {
    $request = Request::create('/api/login', 'POST', [
        'username' => 'Arthur',
        'password' => 'Junior77*',
    ]);
    $controller = new AuthController;
    $response = $controller->login($request);
    echo 'Status: '.$response->getStatusCode()."\n";
    echo 'Content: '.$response->getContent()."\n";
} catch (Exception $e) {
    echo 'Error: '.$e->getMessage()."\n".$e->getTraceAsString();
} catch (Error $e) {
    echo 'Fatal Error: '.$e->getMessage()."\n".$e->getTraceAsString();
}
