<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $request = Illuminate\Http\Request::create('/api/login', 'POST', [
        'username' => 'Arthur',
        'password' => 'Junior77*'
    ]);
    $controller = new App\Http\Controllers\AuthController();
    $response = $controller->login($request);
    echo "Status: " . $response->getStatusCode() . "\n";
    echo "Content: " . $response->getContent() . "\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n" . $e->getTraceAsString();
} catch (\Error $e) {
    echo "Fatal Error: " . $e->getMessage() . "\n" . $e->getTraceAsString();
}
