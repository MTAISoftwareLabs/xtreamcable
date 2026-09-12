<?php

namespace Database\Seeders;

use App\Models\ActivityLog;
use App\Models\ConsoleSetting;
use App\Models\ContentCategory;
use App\Models\Package;
use App\Models\Reseller;
use App\Models\Server;
use App\Models\StreamSource;
use App\Models\User;
use App\Models\UserGroup;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Master Admin & Operator Users
        User::updateOrCreate(
            ['email' => 'admin@xtreamcable.local'],
            [
                'name' => 'Master Admin',
                'password' => Hash::make('XtreamMaster2026!'),
            ]
        );

        User::updateOrCreate(
            ['email' => 'operator@xtreamcable.local'],
            [
                'name' => 'Operator',
                'password' => Hash::make('XtreamMaster2026!'),
            ]
        );

        // 2. Console Settings
        if (ConsoleSetting::count() === 0) {
            ConsoleSetting::create([
                'console_name' => 'XTREAM CABLE',
                'timezone' => 'Asia/Karachi',
                'operational_alerts' => true,
                'session_timeout_minutes' => 720,
                'email_notifications' => true,
                'incident_alerts' => true,
            ]);
        }

        // 3. User Groups
        if (UserGroup::count() === 0) {
            UserGroup::create(['name' => 'VIP Customers', 'description' => 'High-bandwidth premium subscribers', 'member_count' => 12]);
            UserGroup::create(['name' => 'Standard Tier', 'description' => 'Default subscriber access level', 'member_count' => 45]);
            UserGroup::create(['name' => 'Trial Accounts', 'description' => '24-hour evaluation subscribers', 'member_count' => 8]);
        }

        // 4. Packages
        if (Package::count() === 0) {
            Package::create(['name' => 'Ultra 4K All-Access', 'description' => 'Live Sports, 4K Movies & VOD library', 'duration_days' => 30, 'price' => 24.99, 'status' => 'active']);
            Package::create(['name' => 'Sports & Entertainment', 'description' => 'Premium sports networks + general entertainment', 'duration_days' => 30, 'price' => 17.99, 'status' => 'active']);
            Package::create(['name' => 'Basic Cable', 'description' => 'Essential national and regional channels', 'duration_days' => 30, 'price' => 9.99, 'status' => 'active']);
        }

        // 5. Servers
        if (Server::count() === 0) {
            Server::create(['name' => 'Origin Edge 01 - US East', 'host' => '145.223.120.23:8080', 'capacity' => 500, 'status' => 'operational']);
            Server::create(['name' => 'Transcoder Cluster EU', 'host' => 'eu-transcode.xtreamcable.net', 'capacity' => 1000, 'status' => 'operational']);
            Server::create(['name' => 'CDN Relay Asia', 'host' => 'asia-relay.xtreamcable.net', 'capacity' => 750, 'status' => 'operational']);
        }

        // 6. Stream Sources
        if (StreamSource::count() === 0) {
            StreamSource::create(['name' => 'Direct Satellite Feed - Feed A', 'url' => 'udp://@239.255.1.1:5000', 'status' => 'active']);
            StreamSource::create(['name' => 'Fiber Uplink Origin - Main', 'url' => 'rtmp://uplink.xtreamcable.net/live/primary', 'status' => 'active']);
        }

        // 7. Categories
        if (ContentCategory::count() === 0) {
            ContentCategory::create(['name' => 'Sports HD', 'description' => 'Live football, basketball, racing', 'content_count' => 48]);
            ContentCategory::create(['name' => 'Movies 4K', 'description' => 'On-demand cinema and premieres', 'content_count' => 120]);
            ContentCategory::create(['name' => 'News 24/7', 'description' => 'Global and regional news channels', 'content_count' => 24]);
        }

        // 8. Resellers
        if (Reseller::count() === 0) {
            Reseller::create(['name' => 'Apex Stream Partners', 'email' => 'partners@apexstream.net', 'capacity' => 250, 'credits' => 1500, 'status' => 'active']);
            Reseller::create(['name' => 'Nova Media Group', 'email' => 'admin@novamedia.org', 'capacity' => 100, 'credits' => 650, 'status' => 'active']);
        }

        // 9. Initial Activity
        if (ActivityLog::count() === 0) {
            ActivityLog::create(['event_type' => 'system.startup', 'message' => 'Master console initialized and operational', 'entity_type' => 'system', 'entity_id' => '1']);
        }
    }
}
