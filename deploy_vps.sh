#!/bin/bash
# Setup database
mysql -e "CREATE DATABASE IF NOT EXISTS xtreamcable;"
mysql -e "CREATE USER IF NOT EXISTS 'xtreamcable'@'localhost' IDENTIFIED BY 'XtreamPass2026';"
mysql -e "GRANT ALL PRIVILEGES ON xtreamcable.* TO 'xtreamcable'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"
echo "DB_SETUP_OK"

# Clone repo
cd /var/www
if [ -d "xtreamcable" ]; then
    cd xtreamcable
    git pull origin main
else
    git clone https://github.com/MTAISoftwareLabs/xtreamcable.git
    cd xtreamcable
fi

# Create .env
cat > .env << 'ENVFILE'
APP_NAME=XtreamCable
APP_ENV=production
APP_KEY=base64:gn9e9zIHyityZLmZ+9BmA74HpZJcpM7RWZh6vvY0kbg=
APP_DEBUG=false
APP_URL=https://xtremetelevisiontv.com

APP_LOCALE=en
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=en_US

APP_MAINTENANCE_DRIVER=file

BCRYPT_ROUNDS=12

LOG_CHANNEL=stack
LOG_STACK=single
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=xtreamcable
DB_USERNAME=xtreamcable
DB_PASSWORD=XtreamPass2026

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=null

BROADCAST_CONNECTION=log
FILESYSTEM_DISK=local
QUEUE_CONNECTION=database

CACHE_STORE=database

MAIL_MAILER=log
MAIL_SCHEME=null
MAIL_HOST=127.0.0.1
MAIL_PORT=2525
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_FROM_ADDRESS="hello@xtremetelevisiontv.com"
MAIL_FROM_NAME="${APP_NAME}"

VITE_APP_NAME="${APP_NAME}"
ENVFILE

# Install dependencies
composer install --no-dev --optimize-autoloader --no-interaction
npm install
npm run build

# Laravel setup
php artisan key:generate --force
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan storage:link

# Set permissions
chown -R www-data:www-data /var/www/xtreamcable
chmod -R 755 /var/www/xtreamcable
chmod -R 775 /var/www/xtreamcable/storage
chmod -R 775 /var/www/xtreamcable/bootstrap/cache

echo "DEPLOY_COMPLETE"
