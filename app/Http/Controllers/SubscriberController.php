<?php

namespace App\Http\Controllers;

use App\Mail\SubscriberWelcomeMail;
use App\Models\ActivityLog;
use App\Models\CreditTransaction;
use App\Models\Package;
use App\Models\Reseller;
use App\Models\Subscriber;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SubscriberController extends Controller
{
    public function index(Request $request)
    {
        $q = $request->q;
        $resellerId = $request->session()->get('reseller_id');

        $query = Subscriber::leftJoin('packages', 'packages.id', '=', 'subscribers.package_id')
            ->leftJoin('user_groups', 'user_groups.id', '=', 'subscribers.group_id')
            ->select('subscribers.*', 'packages.name as packageName', 'user_groups.name as groupName');

        if ($resellerId) {
            $query->where('subscribers.reseller_id', $resellerId);
        }

        if ($q) {
            $query->where(fn ($b) => $b->where('subscribers.name', 'like', "%{$q}%")
                ->orWhere('subscribers.username', 'like', "%{$q}%")
                ->orWhere('subscribers.email', 'like', "%{$q}%"));
        }

        $items = $query->orderBy('subscribers.created_at', 'desc')->get()->map(function ($sub) {
            if (empty($sub->raw_password)) {
                $gen = 'Pass#'.rand(1000, 9999);
                Subscriber::where('id', $sub->id)->update([
                    'raw_password' => $gen,
                    'password' => Hash::make($gen),
                ]);
                $sub->raw_password = $gen;
            }
            $sub->password = $sub->raw_password;

            return $sub;
        });

        return response()->json(['items' => $items]);
    }

    public function store(Request $request)
    {
        $request->validate(['name' => 'required', 'username' => 'required|unique:subscribers,username']);

        $sessionResellerId = $request->session()->get('reseller_id');
        $resellerId = $sessionResellerId ?: ($request->input('reseller_id', $request->input('resellerId')) ?: null);
        $packageId = $request->input('package_id', $request->input('packageId'));
        $groupId = $request->input('group_id', $request->input('groupId'));
        $expiresAtInput = $request->input('expires_at', $request->input('expiresAt'));

        if ($sessionResellerId) {
            $reseller = Reseller::findOrFail($sessionResellerId);
            if ($reseller->credits < 1) {
                return response()->json(['message' => 'Insufficient credit balance to create line. Please contact administrator.'], 422);
            }
            $reseller->decrement('credits', 1);

            CreditTransaction::create([
                'reseller_id' => $reseller->id,
                'amount' => 1,
                'direction' => 'used',
                'description' => "Created line for @{$request->username}",
            ]);
        }

        $rawPassword = $request->password ? trim($request->password) : 'Pass#'.rand(1000, 9999);

        $subscriber = Subscriber::create([
            'name' => trim($request->name),
            'username' => trim($request->username),
            'email' => $request->email ? trim($request->email) : null,
            'package_id' => $packageId ?: null,
            'group_id' => $groupId ?: null,
            'reseller_id' => $resellerId ?: null,
            'expires_at' => $expiresAtInput ? date('Y-m-d H:i:s', strtotime($expiresAtInput)) : now()->addDays(30),
            'status' => $request->input('status', 'active'),
            'password' => Hash::make($rawPassword),
            'raw_password' => $rawPassword,
        ]);

        ActivityLog::create(['event_type' => 'user.created', 'message' => "Subscriber {$subscriber->name} (@{$subscriber->username}) was created.", 'entity_type' => 'user', 'entity_id' => $subscriber->id]);

        if ($subscriber->email) {
            try {
                $packageName = null;
                if ($subscriber->package_id) {
                    $packageName = Package::find($subscriber->package_id)?->name;
                }
                Mail::to($subscriber->email)->send(new SubscriberWelcomeMail($subscriber, $rawPassword, $packageName));
            } catch (\Throwable $e) {
                Log::warning("Subscriber welcome email failed for {$subscriber->email}: ".$e->getMessage());
            }
        }

        $subscriber->password = $rawPassword;

        return response()->json(['item' => $subscriber, 'generated_password' => $rawPassword], 201);
    }

    public function update(Request $request, $id)
    {
        $resellerId = $request->session()->get('reseller_id');
        $query = Subscriber::query();
        if ($resellerId) {
            $query->where('reseller_id', $resellerId);
        }

        $subscriber = $query->findOrFail($id);

        $updateData = [];
        if ($request->has('name')) {
            $updateData['name'] = trim($request->name);
        }
        if ($request->has('username')) {
            $updateData['username'] = trim($request->username);
        }
        if ($request->has('email')) {
            $updateData['email'] = $request->email ? trim($request->email) : null;
        }
        if ($request->has('packageId') || $request->has('package_id')) {
            $updateData['package_id'] = $request->input('package_id', $request->input('packageId')) ?: null;
        }
        if ($request->has('groupId') || $request->has('group_id')) {
            $updateData['group_id'] = $request->input('group_id', $request->input('groupId')) ?: null;
        }
        if (! $resellerId && ($request->has('resellerId') || $request->has('reseller_id'))) {
            $updateData['reseller_id'] = $request->input('reseller_id', $request->input('resellerId')) ?: null;
        }
        if ($request->has('status')) {
            $updateData['status'] = $request->status;
        }
        if ($request->has('expiresAt') || $request->has('expires_at')) {
            $exp = $request->input('expires_at', $request->input('expiresAt'));
            $updateData['expires_at'] = $exp ? date('Y-m-d H:i:s', strtotime($exp)) : null;
        }
        if ($request->filled('password')) {
            $raw = trim($request->password);
            $updateData['password'] = Hash::make($raw);
            $updateData['raw_password'] = $raw;
        }

        $subscriber->update($updateData);
        ActivityLog::create(['event_type' => 'user.updated', 'message' => "Subscriber {$subscriber->name} was updated.", 'entity_type' => 'user', 'entity_id' => $subscriber->id]);

        $subscriber->password = $subscriber->raw_password;

        return response()->json(['item' => $subscriber]);
    }

    public function destroy(Request $request, $id)
    {
        $resellerId = $request->session()->get('reseller_id');
        $query = Subscriber::query();
        if ($resellerId) {
            $query->where('reseller_id', $resellerId);
        }

        $subscriber = $query->findOrFail($id);
        $subscriber->delete();
        ActivityLog::create(['event_type' => 'user.deleted', 'message' => "Subscriber {$subscriber->name} was removed.", 'entity_type' => 'user', 'entity_id' => $id]);

        return response()->noContent();
    }
}
