<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function session(Request $request)
    {
        $user = Auth::user();

        return response()->json([
            'authenticated' => Auth::check(),
            'user' => $user ? [
                'name' => $user->name,
                'email' => $user->email,
                'role' => 'Master access',
            ] : null,
        ]);
    }

    public function login(Request $request)
    {
        $username = strtolower(trim($request->input('username', '')));
        $password = trim($request->input('password', ''));

        if (empty($username) || empty($password)) {
            return response()->json(['message' => 'Please provide both username and password.'], 422);
        }

        $user = User::where(function ($query) use ($username) {
            $query->where('email', $username)
                ->orWhere('email', $username.'@xtreamcable.local')
                ->orWhere('name', $username);
        })->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            return response()->json(['message' => 'Invalid operator credentials. Please check your username and password.'], 401);
        }

        Auth::login($user, true);
        $request->session()->regenerate();

        return response()->json([
            'authenticated' => true,
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => 'Master access',
            ],
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
