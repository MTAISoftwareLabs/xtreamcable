<?php

namespace App\Http\Controllers;

use App\Models\Reseller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function session(Request $request)
    {
        $user = Auth::user();
        if ($user) {
            return response()->json([
                'authenticated' => true,
                'user' => [
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => 'Master access',
                ],
            ]);
        }

        $resellerId = $request->session()->get('reseller_id');
        if ($resellerId) {
            $reseller = Reseller::find($resellerId);
            if ($reseller && $reseller->status === 'active') {
                return response()->json([
                    'authenticated' => true,
                    'user' => [
                        'id' => $reseller->id,
                        'name' => $reseller->name,
                        'email' => $reseller->email,
                        'role' => 'Reseller',
                        'credits' => $reseller->credits,
                        'capacity' => $reseller->capacity,
                    ],
                ]);
            }
        }

        return response()->json(['authenticated' => false, 'user' => null]);
    }

    public function login(Request $request)
    {
        try {
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

            if ($user && !empty($user->password) && Hash::check($password, $user->password)) {
                Auth::login($user, true);
                $request->session()->forget('reseller_id');
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

            // Check Resellers table
            $reseller = Reseller::where(function ($query) use ($username) {
                $query->where('email', $username)
                    ->orWhere('name', $username);
            })->first();

            if ($reseller && !empty($reseller->password) && Hash::check($password, $reseller->password)) {
                if ($reseller->status !== 'active') {
                    return response()->json(['message' => 'Your reseller account is currently suspended.'], 403);
                }

                $request->session()->put('reseller_id', $reseller->id);
                $request->session()->regenerate();

                return response()->json([
                    'authenticated' => true,
                    'user' => [
                        'id' => $reseller->id,
                        'name' => $reseller->name,
                        'email' => $reseller->email,
                        'role' => 'Reseller',
                        'credits' => $reseller->credits,
                        'capacity' => $reseller->capacity,
                    ],
                ]);
            }

            return response()->json(['message' => 'Invalid operator credentials. Please check your username and password.'], 401);
        } catch (\Exception $e) {
            return response()->json(['message' => 'DEBUG ERROR: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine()], 500);
        } catch (\Error $e) {
            return response()->json(['message' => 'DEBUG FATAL: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine()], 500);
        }
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->forget('reseller_id');
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['authenticated' => false]);
    }
}
