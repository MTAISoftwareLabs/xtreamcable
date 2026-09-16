<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Package;
use Illuminate\Http\Request;

class PackageController extends Controller
{
    public function index()
    {
        return response()->json(['items' => Package::orderBy('created_at', 'desc')->get()]);
    }

    public function store(Request $request)
    {
        $data = $request->all();
        if ($request->has('durationDays')) {
            $data['duration_days'] = $request->durationDays;
            unset($data['durationDays']);
        }
        $package = Package::create($data);
        ActivityLog::create(['event_type' => 'package.created', 'message' => "Package {$package->name} was created.", 'entity_type' => 'package', 'entity_id' => $package->id]);

        return response()->json(['item' => $package], 201);
    }

    public function update(Request $request, $id)
    {
        $package = Package::findOrFail($id);
        $data = $request->all();
        if ($request->has('durationDays')) {
            $data['duration_days'] = $request->durationDays;
            unset($data['durationDays']);
        }
        $package->update($data);
        ActivityLog::create(['event_type' => 'package.updated', 'message' => "Package {$package->name} was updated.", 'entity_type' => 'package', 'entity_id' => $package->id]);

        return response()->json(['item' => $package]);
    }

    public function destroy($id)
    {
        $package = Package::findOrFail($id);
        $package->delete();
        ActivityLog::create(['event_type' => 'package.deleted', 'message' => "Package {$package->name} was removed.", 'entity_type' => 'package', 'entity_id' => $id]);

        return response()->noContent();
    }
}
