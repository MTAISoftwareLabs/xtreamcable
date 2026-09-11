<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function session(Request $request)
    {
        return response()->json([
            'authenticated' => Auth::check(),
            'user' => Auth::user() ? ['name' => 'Operator', 'role' => 'Master access'] : null
        ]);
    }

    public function login(Request $request)
    {
        $username = strtolower(trim($request->input('username')));
        $password = trim($request->input('password', ''));

        if ($username !== 'operator' || $password !== 'xtream2026') {
            return response()->json(['message' => 'That operator ID or password is not recognized.'], 401);
        }

        // Fake login for single-user system
        $user = \App\Models\User::firstOrCreate(
            ['email' => 'operator@xtreamcable.local'],
            ['name' => 'Operator', 'password' => bcrypt('xtream2026')]
        );

        Auth::login($user);

        return response()->json([
            'authenticated' => true,
            'user' => ['name' => 'Operator', 'role' => 'Master access']
        ]);
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['authenticated' => false]);
    }
}
