<?php

namespace Tests\Feature;

use App\Models\Subscriber;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class XtreamCodeTest extends TestCase
{
    use RefreshDatabase;

    public function test_player_api_authenticates_valid_subscriber(): void
    {
        $subscriber = Subscriber::create([
            'name' => 'Test User',
            'username' => 'testuser',
            'password' => Hash::make('Pass#1234'),
            'raw_password' => 'Pass#1234',
            'status' => 'active',
            'expires_at' => now()->addDays(30),
        ]);

        $response = $this->get('/player_api.php?username=testuser&password=Pass%231234');

        $response->assertStatus(200);
        $response->assertJsonPath('user_info.username', 'testuser');
        $response->assertJsonPath('user_info.auth', 1);
    }

    public function test_player_api_rejects_invalid_subscriber(): void
    {
        $response = $this->get('/player_api.php?username=wrong&password=wrong');

        $response->assertStatus(200);
        $response->assertJsonPath('user_info.auth', 0);
    }

    public function test_get_m3u_playlist(): void
    {
        $subscriber = Subscriber::create([
            'name' => 'M3U User',
            'username' => 'm3uuser',
            'password' => Hash::make('Pass#5678'),
            'raw_password' => 'Pass#5678',
            'status' => 'active',
            'expires_at' => now()->addDays(30),
        ]);

        $response = $this->get('/get.php?username=m3uuser&password=Pass%235678&type=m3u_plus');

        $response->assertStatus(200);
        $this->assertStringContainsString('#EXTM3U', $response->getContent());
    }

    public function test_xmltv_epg_feed(): void
    {
        $subscriber = Subscriber::create([
            'name' => 'EPG User',
            'username' => 'epguser',
            'password' => Hash::make('Pass#9999'),
            'raw_password' => 'Pass#9999',
            'status' => 'active',
            'expires_at' => now()->addDays(30),
        ]);

        $response = $this->get('/xmltv.php?username=epguser&password=Pass%239999');

        $response->assertStatus(200);
        $this->assertStringContainsString('<tv', $response->getContent());
    }
}
