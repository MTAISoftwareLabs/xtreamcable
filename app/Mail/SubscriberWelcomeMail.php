<?php

namespace App\Mail;

use App\Models\Subscriber;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class SubscriberWelcomeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Subscriber $subscriber, public string $password, public ?string $packageName = null) {}

    public function build()
    {
        return $this->subject('Your XTREME CABLE Subscription Details')
            ->html("
                <div style='font-family: Arial, sans-serif; background-color: #0b1120; color: #f8fafc; padding: 30px; border-radius: 8px;'>
                    <h2 style='color: #06b6d4;'>Welcome, {$this->subscriber->name}!</h2>
                    <p>Your streaming access has been activated successfully.</p>
                    <div style='background-color: #1e293b; padding: 15px; border-radius: 6px; margin: 20px 0;'>
                        <p><strong>Portal URL:</strong> <a href='".config('app.url')."' style='color: #22d3ee;'>".config('app.url')."</a></p>
                        <p><strong>Username:</strong> {$this->subscriber->username}</p>
                        <p><strong>Password:</strong> <code style='color: #22d3ee; font-size: 16px;'>{$this->password}</code></p>
                        <p><strong>Plan:</strong> ".($this->packageName ?? 'Standard Pass').'</p>
                        <p><strong>Expires:</strong> '.($this->subscriber->expires_at ? $this->subscriber->expires_at->format('Y-m-d') : '30 Days')."</p>
                    </div>
                    <p>Use your username and password in your IPTV App (IPTV Smarters, XCIPTV, TiviMate) to begin watching.</p>
                    <hr style='border-color: #334155;'/>
                    <p style='font-size: 12px; color: #94a3b8;'>XTREME CABLE Channel Operations</p>
                </div>
            ");
    }
}
