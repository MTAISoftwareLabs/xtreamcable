<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EnsureConsoleAuthenticated
{
    public function handle(Request $request, Closure $next)
    {
        if (Auth::check() || $request->session()->has('reseller_id')) {
            return $next($request);
        }

        return response()->json(['message' => 'Unauthenticated.'], 401);
    }
}
