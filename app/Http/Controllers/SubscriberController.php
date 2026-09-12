<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Subscriber;
use Illuminate\Http\Request;

class SubscriberController extends Controller
{
    public function index(Request $request)
    {
        $q = $request->q;
        $query = Subscriber::leftJoin('packages', 'packages.id', '=', 'subscribers.package_id')
            ->leftJoin('user_groups', 'user_groups.id', '=', 'subscribers.group_id')
            ->select('subscribers.*', 'packages.name as packageName', 'user_groups.name as groupName');

        if ($q) {
            $query->where(fn ($b) => $b->where('subscribers.name', 'like', "%{$q}%")
                ->orWhere('subscribers.username', 'like', "%{$q}%")
                ->orWhere('subscribers.email', 'like', "%{$q}%"));
        }

        return response()->json(['items' => $query->orderBy('subscribers.created_at', 'desc')->get()]);
    }

    public function store(Request $request)
    {
        $request->validate(['name' => 'required', 'username' => 'required']);
        $subscriber = Subscriber::create($request->all());
        ActivityLog::create(['event_type' => 'user.created', 'message' => "Subscriber {$subscriber->name} was created.", 'entity_type' => 'user', 'entity_id' => $subscriber->id]);

        return response()->json(['item' => $subscriber], 201);
    }

    public function update(Request $request, $id)
    {
        $subscriber = Subscriber::findOrFail($id);
        $subscriber->update($request->all());
        ActivityLog::create(['event_type' => 'user.updated', 'message' => "Subscriber {$subscriber->name} was updated.", 'entity_type' => 'user', 'entity_id' => $subscriber->id]);

        return response()->json(['item' => $subscriber]);
    }

    public function destroy($id)
    {
        $subscriber = Subscriber::findOrFail($id);
        $subscriber->delete();
        ActivityLog::create(['event_type' => 'user.deleted', 'message' => "Subscriber {$subscriber->name} was removed.", 'entity_type' => 'user', 'entity_id' => $id]);

        return response()->noContent();
    }
}
