<?php

namespace Tests\Feature;

use App\Models\Reseller;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_master_user_can_login()
    {
        $user = User::factory()->create([
            'email' => 'admin@xtreamcable.local',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'username' => 'admin@xtreamcable.local',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'authenticated' => true,
                'user' => [
                    'email' => 'admin@xtreamcable.local',
                    'role' => 'Master access',
                ],
            ]);

        $this->assertAuthenticatedAs($user);
    }

    public function test_reseller_can_login()
    {
        $reseller = Reseller::factory()->create([
            'email' => 'reseller@example.com',
            'password' => Hash::make('password123'),
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/login', [
            'username' => 'reseller@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'authenticated' => true,
                'user' => [
                    'email' => 'reseller@example.com',
                    'role' => 'Reseller',
                ],
            ]);

        $this->assertEquals($reseller->id, session('reseller_id'));
    }

    public function test_login_fails_with_invalid_credentials()
    {
        User::factory()->create([
            'email' => 'admin@xtreamcable.local',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'username' => 'admin@xtreamcable.local',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401)
            ->assertJson(['message' => 'Invalid operator credentials. Please check your username and password.']);
    }

    public function test_suspended_reseller_cannot_login()
    {
        Reseller::factory()->create([
            'email' => 'suspended@example.com',
            'password' => Hash::make('password123'),
            'status' => 'suspended',
        ]);

        $response = $this->postJson('/api/login', [
            'username' => 'suspended@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(403)
            ->assertJson(['message' => 'Your reseller account is currently suspended.']);
    }

    public function test_master_user_can_fetch_session()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/session');

        $response->assertStatus(200)
            ->assertJson([
                'authenticated' => true,
                'user' => [
                    'email' => $user->email,
                    'role' => 'Master access',
                ],
            ]);
    }

    public function test_reseller_can_fetch_session()
    {
        $reseller = Reseller::factory()->create();

        $response = $this->withSession(['reseller_id' => $reseller->id])->getJson('/api/session');

        $response->assertStatus(200)
            ->assertJson([
                'authenticated' => true,
                'user' => [
                    'email' => $reseller->email,
                    'role' => 'Reseller',
                ],
            ]);
    }

    public function test_user_can_logout()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/logout');

        $response->assertStatus(200)
            ->assertJson(['authenticated' => false]);

        $this->assertGuest();
    }
}
