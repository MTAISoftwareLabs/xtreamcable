#!/bin/bash
set -e

# Pull latest code
cd /var/www/xtreamcable
git pull origin main

# Fix migration - drop partially created tables and re-run
php artisan migrate:fresh --force

# Re-cache
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Set permissions
chown -R www-data:www-data /var/www/xtreamcable
chmod -R 755 /var/www/xtreamcable
chmod -R 775 /var/www/xtreamcable/storage
chmod -R 775 /var/www/xtreamcable/bootstrap/cache

echo "MIGRATION_FIXED"

# Setup Nginx
cat > /etc/nginx/sites-available/xtreamcable << 'NGINXCONF'
server {
    listen 80;
    server_name xtremetelevisiontv.com www.xtremetelevisiontv.com;
    root /var/www/xtreamcable/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;
    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
NGINXCONF

# Enable site and disable default
ln -sf /etc/nginx/sites-available/xtreamcable /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
nginx -t && systemctl restart nginx

# Check if PHP-FPM is running
systemctl status php8.3-fpm --no-pager || (apt-get install -y php8.3-fpm && systemctl start php8.3-fpm)

# Install certbot for SSL
apt-get update -qq
apt-get install -y certbot python3-certbot-nginx -qq

echo "NGINX_SETUP_COMPLETE"
echo ""
echo "=== NEXT STEP ==="
echo "Point your domain xtremetelevisiontv.com A record to: 145.223.120.23"
echo "Then run: certbot --nginx -d xtremetelevisiontv.com -d www.xtremetelevisiontv.com --non-interactive --agree-tos -m admin@xtremetelevisiontv.com"
