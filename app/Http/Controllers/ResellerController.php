<?php

namespace App\Http\Controllers;

use App\Models\Reseller;
use App\Models\ActivityLog;
use App\Models\CreditTransaction;
use Illuminate\Http\Request;

class ResellerController extends Controller
{
    public function index(Request $request)
    {
        $q = $request->q;
        $query = Reseller::query();
        if ($q) {
            $query->where(fn($b) => $b->where('name', 'like', "%{$q}%")->orWhere('email', 'like', "%{$q}%"));
        }
        return response()->json(['items' => $query->orderBy('created_at', 'desc')->get()]);
    }

    public function store(Request $request)
    {
        $request->validate(['name' => 'required', 'email' => 'required']);
        $reseller = Reseller::create($request->all());
        if ($request->credits > 0) {
            CreditTransaction::create(['reseller_id' => $reseller->id, 'amount' => $request->credits, 'direction' => 'issued', 'description' => "Initial allocation for {$reseller->name}"]);
        }
        ActivityLog::create(['event_type' => 'reseller.created', 'message' => "Reseller {$reseller->name} was created.", 'entity_type' => 'reseller', 'entity_id' => $reseller->id]);
        return response()->json(['item' => $reseller], 201);
    }

    public function update(Request $request, $id)
    {
        $reseller = Reseller::findOrFail($id);
        $reseller->update($request->all());
        ActivityLog::create(['event_type' => 'reseller.updated', 'message' => "Reseller {$reseller->name} was updated.", 'entity_type' => 'reseller', 'entity_id' => $reseller->id]);
        return response()->json(['item' => $reseller]);
    }

    public function destroy($id)
    {
        $reseller = Reseller::findOrFail($id);
        $reseller->delete();
        ActivityLog::create(['event_type' => 'reseller.deleted', 'message' => "Reseller {$reseller->name} was removed.", 'entity_type' => 'reseller', 'entity_id' => $id]);
        return response()->noContent();
    }
}
