<?php
echo "Starting extraction...<br>";
try {
    $phar = new PharData('xtreamcable-deploy.tar.gz');
    $phar->extractTo(__DIR__, null, true);
    echo "Extraction completed successfully!";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>