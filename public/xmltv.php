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
    $response = $controller->xmltv($request);

    header('Content-Type: text/xml', true, 200);
    echo $response->getContent();
} catch (Throwable $e) {
    header('Content-Type: text/xml', true, 200);
    echo '<?xml version="1.0" encoding="UTF-8"?><tv><error>'.htmlspecialchars($e->getMessage()).'</error></tv>';
}
