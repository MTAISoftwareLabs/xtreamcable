<?php

use Illuminate\Contracts\Console\Kernel;

echo 'Starting extraction on GoDaddy...<br>';
try {
    if (file_exists('xtreamcable-deploy-godaddy.tar.gz')) {
        $phar = new PharData('xtreamcable-deploy-godaddy.tar.gz');
        $phar->extractTo(__DIR__, null, true);
        echo 'Extraction completed successfully on GoDaddy!<br>';
    } else {
        echo 'Archive file not found.<br>';
    }
} catch (Exception $e) {
    echo 'Error: '.$e->getMessage();
}

// Run database migrations if bootstrap autoload exists
if (file_exists(__DIR__.'/vendor/autoload.php')) {
    require __DIR__.'/vendor/autoload.php';
    $app = require_once __DIR__.'/bootstrap/app.php';
    $kernel = $app->make(Kernel::class);
    $kernel->call('migrate', ['--force' => true]);
    $kernel->call('config:clear');
    $kernel->call('cache:clear');
    echo 'Database migrations and cache clear complete!';
}
