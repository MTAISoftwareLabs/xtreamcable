<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_groups', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->integer('member_count')->default(0);
            $table->timestamps();
        });

        Schema::create('packages', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->integer('duration_days')->default(30);
            $table->decimal('price', 10, 2)->default(0);
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('resellers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('password')->nullable();
            $table->string('raw_password')->nullable();
            $table->integer('capacity')->default(100);
            $table->integer('credits')->default(0);
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('subscribers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('username')->unique();
            $table->string('email')->nullable();
            $table->string('password')->nullable();
            $table->string('raw_password')->nullable();
            $table->string('status')->default('active'); // active, paused, expired
            $table->timestamp('expires_at')->nullable();
            $table->foreignId('package_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('group_id')->nullable()->constrained('user_groups')->nullOnDelete();
            $table->foreignId('reseller_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('credit_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reseller_id')->nullable()->constrained()->nullOnDelete();
            $table->integer('amount');
            $table->string('direction'); // issued, transferred, used
            $table->string('description')->nullable();
            $table->timestamps();
        });

        Schema::create('content_items', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('content_type')->default('live_tv'); // live_tv, movie, series
            $table->string('category')->nullable();
            $table->string('country')->nullable();
            $table->string('source')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('servers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('host');
            $table->integer('capacity')->default(100);
            $table->string('status')->default('operational');
            $table->timestamps();
        });

        Schema::create('stream_sources', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('url');
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('content_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->integer('content_count')->default(0);
            $table->timestamps();
        });

        Schema::create('epg_schedules', function (Blueprint $table) {
            $table->id();
            $table->string('channel_name');
            $table->string('program_name');
            $table->timestamp('starts_at');
            $table->timestamp('ends_at');
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->string('event_type');
            $table->text('message');
            $table->string('entity_type')->nullable();
            $table->string('entity_id')->nullable();
            $table->timestamps();
        });

        Schema::create('console_integrations', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('category')->default('platform');
            $table->text('description')->nullable();
            $table->json('config')->nullable();
            $table->string('status')->default('available');
            $table->timestamps();
        });

        Schema::create('console_settings', function (Blueprint $table) {
            $table->id();
            $table->string('console_name')->default('XTREME CABLE');
            $table->string('timezone')->default('Asia/Karachi');
            $table->boolean('operational_alerts')->default(true);
            $table->integer('session_timeout_minutes')->default(720);
            $table->boolean('email_notifications')->default(true);
            $table->boolean('incident_alerts')->default(true);
            $table->timestamps();
        });

        Schema::create('billing_invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique();
            $table->string('period_label');
            $table->decimal('amount', 10, 2);
            $table->string('status')->default('pending');
            $table->timestamp('issued_at');
            $table->timestamps();
        });

        Schema::create('support_requests', function (Blueprint $table) {
            $table->id();
            $table->string('subject');
            $table->text('message');
            $table->string('status')->default('open');
            $table->timestamps();
        });

        // Insert default console settings
        DB::table('console_settings')->insert([
            'id' => 1,
            'console_name' => 'XTREME CABLE',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('support_requests');
        Schema::dropIfExists('billing_invoices');
        Schema::dropIfExists('console_settings');
        Schema::dropIfExists('console_integrations');
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('epg_schedules');
        Schema::dropIfExists('content_categories');
        Schema::dropIfExists('stream_sources');
        Schema::dropIfExists('servers');
        Schema::dropIfExists('content_items');
        Schema::dropIfExists('credit_transactions');
        Schema::dropIfExists('subscribers');
        Schema::dropIfExists('resellers');
        Schema::dropIfExists('packages');
        Schema::dropIfExists('user_groups');
    }
};
