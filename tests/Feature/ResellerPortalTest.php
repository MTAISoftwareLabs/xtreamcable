<?php

namespace Tests\Feature;

use App\Mail\ResellerWelcomeMail;
use App\Mail\SubscriberWelcomeMail;
use App\Models\Reseller;
use App\Models\Subscriber;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
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

        Mail::fake();

        // Create subscriber as reseller
        $subResponse = $this->postJson('/api/users', [
            'name' => 'John Subscriber',
            'username' => 'john_sub_101',
            'email' => 'john@example.com',
        ]);

        $subResponse->assertStatus(201);

        Mail::assertSent(SubscriberWelcomeMail::class, function ($mail) {
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
        Mail::fake();
        $admin = User::factory()->create();

        $response = $this->actingAs($admin)->postJson('/api/resellers', [
            'name' => 'Arthur',
            'email' => 'arthur@example.com',
            'capacity' => 200,
            'credits' => 1000,
        ]);

        $response->assertStatus(201);

        Mail::assertSent(ResellerWelcomeMail::class, function ($mail) {
            return $mail->hasTo('arthur@example.com') && $mail->password !== null && $mail->reseller->email === 'arthur@example.com';
        });
    }

    public function test_reseller_bootstrap_is_strictly_sandboxed()
    {
        $resellerA = Reseller::create([
            'name' => 'Arthur',
            'email' => 'arthur@example.com',
            'password' => Hash::make('Secret123'),
            'capacity' => 200,
            'credits' => 50,
            'status' => 'active',
        ]);

        $resellerB = Reseller::create([
            'name' => 'OtherReseller',
            'email' => 'other@example.com',
            'password' => Hash::make('Secret123'),
            'capacity' => 100,
            'credits' => 10,
            'status' => 'active',
        ]);

        // Arthur's subscriber
        Subscriber::create([
            'name' => 'Sub A',
            'username' => 'sub_a',
            'reseller_id' => $resellerA->id,
            'status' => 'active',
        ]);

        // Other reseller's subscriber
        Subscriber::create([
            'name' => 'Sub B',
            'username' => 'sub_b',
            'reseller_id' => $resellerB->id,
            'status' => 'active',
        ]);

        $this->withSession(['reseller_id' => $resellerA->id]);

        $response = $this->getJson('/api/bootstrap');
        $response->assertStatus(200);

        $json = $response->json();
        $this->assertEquals(1, $json['summary']['activeSubscribers']);
        $this->assertEquals(0, $json['summary']['liveChannels']);
        $this->assertEquals(0, $json['summary']['resellerAccounts']);
        $this->assertCount(0, $json['resellers']); // Cannot see other resellers list
        $this->assertCount(1, $json['users']);
        $this->assertEquals('sub_a', $json['users'][0]['username']);
    }

    public function test_reseller_cannot_assign_subscriber_to_another_reseller_on_create_or_update()
    {
        $resellerA = Reseller::create([
            'name' => 'Arthur',
            'email' => 'arthur@example.com',
            'password' => Hash::make('Secret123'),
            'capacity' => 200,
            'credits' => 50,
            'status' => 'active',
        ]);

        $resellerB = Reseller::create([
            'name' => 'OtherReseller',
            'email' => 'other@example.com',
            'password' => Hash::make('Secret123'),
            'capacity' => 100,
            'credits' => 10,
            'status' => 'active',
        ]);

        $this->withSession(['reseller_id' => $resellerA->id]);

        // Try to create subscriber under reseller B
        $response = $this->postJson('/api/users', [
            'name' => 'Attempt Sub',
            'username' => 'attempt_sub',
            'reseller_id' => $resellerB->id,
        ]);
        $response->assertStatus(201);
        $sub = Subscriber::where('username', 'attempt_sub')->first();
        $this->assertEquals($resellerA->id, $sub->reseller_id); // Forced to reseller A

        // Try to update subscriber to reseller B
        $updateResp = $this->patchJson("/api/users/{$sub->id}", [
            'reseller_id' => $resellerB->id,
        ]);
        $updateResp->assertStatus(200);
        $sub->refresh();
        $this->assertEquals($resellerA->id, $sub->reseller_id); // Stays reseller A
    }

    public function test_subscriber_password_hash_is_hidden_and_update_works()
    {
        $reseller = Reseller::create([
            'name' => 'Arthur',
            'email' => 'arthur@example.com',
            'password' => Hash::make('Secret123'),
            'capacity' => 200,
            'credits' => 50,
            'status' => 'active',
        ]);

        $this->withSession(['reseller_id' => $reseller->id]);

        $createResp = $this->postJson('/api/users', [
            'name' => 'Sub Test',
            'username' => 'sub_test_hash',
            'password' => 'InitialPass123',
        ]);
        $createResp->assertStatus(201);
        $this->assertArrayNotHasKey('password', $createResp->json('item'));

        $sub = Subscriber::where('username', 'sub_test_hash')->first();

        // Update password
        $updateResp = $this->patchJson("/api/users/{$sub->id}", [
            'password' => 'NewCustomPass456',
        ]);
        $updateResp->assertStatus(200);
        $this->assertArrayNotHasKey('password', $updateResp->json('item'));

        $sub->refresh();
        $this->assertTrue(Hash::check('NewCustomPass456', $sub->password));
    }
}
