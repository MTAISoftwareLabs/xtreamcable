<?php

namespace Tests\Feature;

use App\Models\Reseller;
use App\Models\Subscriber;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ResellerPortalTest extends TestCase
{
    use RefreshDatabase;

    public function test_master_admin_can_create_reseller_with_auto_generated_password()
    {
        $admin = User::factory()->create();

        $response = $this->actingAs($admin)->postJson('/api/resellers', [
            'name' => 'William IPTV',
            'email' => 'william@example.com',
            'capacity' => 100,
            'credits' => 50,
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['item', 'generated_password']);

        $reseller = Reseller::where('email', 'william@example.com')->first();
        $this->assertNotNull($reseller);
        $this->assertNotNull($reseller->password);
        $this->assertTrue(Hash::check($response->json('generated_password'), $reseller->password));
    }

    public function test_reseller_can_login_and_create_subscriber_deducting_credit()
    {
        $reseller = Reseller::create([
            'name' => 'William',
            'email' => 'william@example.com',
            'password' => Hash::make('Reseller#1234'),
            'raw_password' => 'Reseller#1234',
            'capacity' => 100,
            'credits' => 5,
            'status' => 'active',
        ]);

        $loginResponse = $this->postJson('/api/login', [
            'username' => 'william@example.com',
            'password' => 'Reseller#1234',
        ]);

        $loginResponse->assertStatus(200)
            ->assertJson([
                'authenticated' => true,
                'user' => [
                    'role' => 'Reseller',
                    'name' => 'William',
                ],
            ]);

        \Illuminate\Support\Facades\Mail::fake();

        // Create subscriber as reseller
        $subResponse = $this->postJson('/api/users', [
            'name' => 'John Subscriber',
            'username' => 'john_sub_101',
            'email' => 'john@example.com',
        ]);

        $subResponse->assertStatus(201);
        
        \Illuminate\Support\Facades\Mail::assertSent(\App\Mail\SubscriberWelcomeMail::class, function ($mail) {
            return $mail->hasTo('john@example.com') && $mail->password !== null && $mail->subscriber->username === 'john_sub_101';
        });

        $reseller->refresh();
        $this->assertEquals(4, $reseller->credits); // Decremented from 5 to 4

        $subscriber = Subscriber::where('username', 'john_sub_101')->first();
        $this->assertNotNull($subscriber);
        $this->assertEquals($reseller->id, $subscriber->reseller_id);
    }
    
    public function test_master_admin_can_create_reseller_and_welcome_email_is_sent()
    {
        \Illuminate\Support\Facades\Mail::fake();
        $admin = User::factory()->create();

        $response = $this->actingAs($admin)->postJson('/api/resellers', [
            'name' => 'Arthur',
            'email' => 'arthur@example.com',
            'capacity' => 200,
            'credits' => 1000,
        ]);

        $response->assertStatus(201);
        
        \Illuminate\Support\Facades\Mail::assertSent(\App\Mail\ResellerWelcomeMail::class, function ($mail) {
            return $mail->hasTo('arthur@example.com') && $mail->password !== null && $mail->reseller->email === 'arthur@example.com';
        });
    }
}
