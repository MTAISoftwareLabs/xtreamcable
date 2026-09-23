<?php

use App\Http\Controllers\XtreamCodeController;
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;

error_reporting(E_ALL);
ini_set('display_errors', 0);

if (! defined('LARAVEL_START')) {
    define('LARAVEL_START', microtime(true));
}

try {
    if (file_exists(__DIR__.'/vendor/autoload.php')) {
        require __DIR__.'/vendor/autoload.php';
        $app = require_once __DIR__.'/bootstrap/app.php';
    } elseif (file_exists(__DIR__.'/../vendor/autoload.php')) {
        require __DIR__.'/../vendor/autoload.php';
        $app = require_once __DIR__.'/../bootstrap/app.php';
    } else {
        throw new Exception('Autoload not found');
    }

    $kernel = $app->make(Kernel::class);
    $kernel->bootstrap();

    $request = Request::capture();
    $controller = $app->make(XtreamCodeController::class);
    $response = $controller->playerApi($request);

    header('Content-Type: application/json', true, 200);
    echo $response->getContent();
} catch (Throwable $e) {
    header('Content-Type: application/json', true, 200);
    echo json_encode([
        'user_info' => [
            'auth' => 0,
            'status' => 'Disabled',
            'message' => 'Invalid username, password, or account expired.',
        ],
    ]);
}
