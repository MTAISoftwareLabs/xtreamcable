<?php

// Clear opcache
if (function_exists('opcache_reset')) {
    opcache_reset();
    echo 'OPCache reset success.<br>';
}
// Run artisan commands
echo '<pre>';
system('php ../artisan cache:clear');
system('php ../artisan config:clear');
system('php ../artisan view:clear');
system('php ../artisan route:clear');
echo '</pre>';
echo 'Cache cleared!';
