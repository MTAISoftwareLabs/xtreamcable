<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function session(Request $request)
    {
        return response()->json([
            'authenticated' => Auth::check(),
            'user' => Auth::user() ? ['name' => Auth::user()->name, 'role' => 'Master access'] : null
        ]);
    }

    public function login(Request $request)
    {
        $username = strtolower(trim($request->input('username')));
        $password = trim($request->input('password', ''));

        $user = \App\Models\User::where('email', $username . '@xtreamcable.local')->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            return response()->json(['message' => 'That operator ID or password is not recognized.'], 401);
        }

        Auth::login($user);

        return response()->json([
            'authenticated' => true,
            'user' => ['name' => $user->name, 'role' => 'Master access']
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

