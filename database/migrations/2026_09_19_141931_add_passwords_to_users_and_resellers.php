<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('resellers', function (Blueprint $table) {
            if (!Schema::hasColumn('resellers', 'password')) {
                $table->string('password')->nullable()->after('email');
            }
            if (!Schema::hasColumn('resellers', 'raw_password')) {
                $table->string('raw_password')->nullable()->after('password');
            }
        });

        Schema::table('subscribers', function (Blueprint $table) {
            if (!Schema::hasColumn('subscribers', 'password')) {
                $table->string('password')->nullable()->after('email');
            }
            if (!Schema::hasColumn('subscribers', 'raw_password')) {
                $table->string('raw_password')->nullable()->after('password');
            }
        });
    }

    public function down(): void
    {
        Schema::table('resellers', function (Blueprint $table) {
            if (Schema::hasColumn('resellers', 'password')) {
                $table->dropColumn('password');
            }
            if (Schema::hasColumn('resellers', 'raw_password')) {
                $table->dropColumn('raw_password');
            }
        });

        Schema::table('subscribers', function (Blueprint $table) {
            if (Schema::hasColumn('subscribers', 'password')) {
                $table->dropColumn('password');
            }
            if (Schema::hasColumn('subscribers', 'raw_password')) {
                $table->dropColumn('raw_password');
            }
        });
    }
};
