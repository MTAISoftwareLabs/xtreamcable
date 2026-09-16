<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\CreditTransaction;
use App\Models\Reseller;
use Illuminate\Http\Request;

class CreditController extends Controller
{
    public function index()
    {
        $transactions = CreditTransaction::leftJoin('resellers', 'resellers.id', '=', 'credit_transactions.reseller_id')
            ->select('credit_transactions.*', 'resellers.name as resellerName')
            ->orderBy('credit_transactions.created_at', 'desc')
            ->limit(100)
            ->get();

        $issued = CreditTransaction::where('direction', 'issued')->sum('amount');
        $used = CreditTransaction::whereIn('direction', ['transferred', 'used'])->sum('amount');
        $balance = $issued - $used;

        return response()->json([
            'balance' => $balance,
            'transactions' => $transactions,
        ]);
    }

    public function issue(Request $request)
    {
        $request->validate(['amount' => 'required|numeric|min:1']);
        $amount = (int) $request->amount;

        $transaction = CreditTransaction::create([
            'reseller_id' => null,
            'amount' => $amount,
            'direction' => 'issued',
            'description' => $request->description ?? 'Issued to master balance',
        ]);

        ActivityLog::create([
            'event_type' => 'credits.issued',
            'message' => "Issued {$amount} credits to master balance.",
            'entity_type' => 'credits',
            'entity_id' => $transaction->id,
        ]);

        return response()->json(['transaction' => $transaction], 201);
    }

    public function transfer(Request $request)
    {
        $request->validate([
            'resellerId' => 'required|exists:resellers,id',
            'amount' => 'required|numeric|min:1',
        ]);

        $reseller = Reseller::findOrFail($request->resellerId);
        $amount = (int) $request->amount;

        $reseller->increment('credits', $amount);

        $transaction = CreditTransaction::create([
            'reseller_id' => $reseller->id,
            'amount' => $amount,
            'direction' => 'transferred',
            'description' => $request->description ?? "Transferred to reseller {$reseller->name}",
        ]);

        ActivityLog::create([
            'event_type' => 'credits.transferred',
            'message' => "Transferred {$amount} credits to {$reseller->name}.",
            'entity_type' => 'credits',
            'entity_id' => $reseller->id,
        ]);

        return response()->json(['transaction' => $transaction]);
    }
}
