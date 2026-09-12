<?php
use Illuminate\Contracts\Console\Kernel;

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Kernel::class);

$kernel->call('migrate', ['--force' => true]);

echo "<h1>Database Migrations Complete!</h1>";
echo "<pre>" . $kernel->output() . "</pre>";
echo "<br><br><a href='/'>Go to Website</a>";
