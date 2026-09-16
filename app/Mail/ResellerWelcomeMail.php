<?php

namespace App\Mail;

use App\Models\Reseller;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ResellerWelcomeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Reseller $reseller, public string $password) {}

    public function build()
    {
        return $this->subject('Welcome to XTREME CABLE Reseller Console')
            ->html("
                <div style='font-family: Arial, sans-serif; background-color: #0b1120; color: #f8fafc; padding: 30px; border-radius: 8px;'>
                    <h2 style='color: #06b6d4;'>Welcome to XTREME CABLE, {$this->reseller->name}!</h2>
                    <p>Your partner account has been initialized on our master platform.</p>
                    <div style='background-color: #1e293b; padding: 15px; border-radius: 6px; margin: 20px 0;'>
                        <p><strong>Login URL:</strong> <a href='".config('app.url')."/login' style='color: #22d3ee;'>".config('app.url')."/login</a></p>
                        <p><strong>Login Email:</strong> {$this->reseller->email}</p>
                        <p><strong>Initial Password:</strong> <code style='color: #22d3ee; font-size: 16px;'>{$this->password}</code></p>
                        <p><strong>Starting Credits:</strong> {$this->reseller->credits}</p>
                    </div>
                    <p>You can now log into your reseller portal using the link above to manage subscriber lines and credit allocations.</p>
                    <hr style='border-color: #334155;'/>
                    <p style='font-size: 12px; color: #94a3b8;'>XTREME CABLE Channel Operations</p>
                </div>
            ");
    }
}
