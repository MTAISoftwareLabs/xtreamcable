<?php

namespace App\Http\Controllers;

use App\Mail\ResellerWelcomeMail;
use App\Models\ActivityLog;
use App\Models\CreditTransaction;
use App\Models\Reseller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class ResellerController extends Controller
{
    public function index(Request $request)
    {
        $q = $request->q;
        $query = Reseller::query();
        if ($q) {
            $query->where(fn ($b) => $b->where('name', 'like', "%{$q}%")->orWhere('email', 'like', "%{$q}%"));
        }

        return response()->json(['items' => $query->orderBy('created_at', 'desc')->get()]);
    }

    public function store(Request $request)
    {
        $request->validate(['name' => 'required', 'email' => 'required|email|unique:resellers,email']);

        $rawPassword = $request->password ? trim($request->password) : 'Reseller#'.rand(1000, 9999);
        $data = $request->all();
        $data['password'] = Hash::make($rawPassword);
        $data['raw_password'] = $rawPassword;

        $reseller = Reseller::create($data);

        if ($request->credits > 0) {
            CreditTransaction::create(['reseller_id' => $reseller->id, 'amount' => $request->credits, 'direction' => 'issued', 'description' => "Initial allocation for {$reseller->name}"]);
        }

        ActivityLog::create(['event_type' => 'reseller.created', 'message' => "Reseller {$reseller->name} was created with password {$rawPassword}.", 'entity_type' => 'reseller', 'entity_id' => $reseller->id]);

        // Attempt Email dispatch safely
        if ($reseller->email) {
            try {
                Mail::to($reseller->email)->send(new ResellerWelcomeMail($reseller, $rawPassword));
            } catch (\Throwable $e) {
                Log::warning("Reseller welcome email failed for {$reseller->email}: ".$e->getMessage());
            }
        }

        return response()->json(['item' => $reseller, 'generated_password' => $rawPassword], 201);
    }

    public function update(Request $request, $id)
    {
        $reseller = Reseller::findOrFail($id);

        $data = $request->all();
        if ($request->filled('password')) {
            $raw = trim($request->password);
            $data['password'] = Hash::make($raw);
            $data['raw_password'] = $raw;
        } else {
            unset($data['password']);
            unset($data['raw_password']);
        }

        $reseller->update($data);
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
