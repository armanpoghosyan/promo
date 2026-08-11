<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Enums\UserRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\AuditLog;

class AuthController extends Controller
{
   public function login(Request $request): JsonResponse
   {
       $credentials = $request->validate([
           'email' => [
               'required',
               'email',
           ],
           'password' => [
               'required',
               'string',
           ],
       ]);

       $user = User::where(
           'email',
           $credentials['email']
       )->first();

       if (
           !$user ||
           !Hash::check(
               $credentials['password'],
               $user->password
           )
       ) {
           return response()->json([
               'message' => 'Invalid credentials.',
           ], 401);
       }

       if (
           !in_array(
               $user->role,
               [
                   UserRole::ADMIN,
                   UserRole::SUPER_ADMIN,
               ],
               true
           )
       ) {
           return response()->json([
               'message' => 'You are not authorized.',
           ], 403);
       }

       $token = $user->createToken(
           'admin-panel'
       )->plainTextToken;

       AuditLog::create([
           'user_id' => $user->id,
           'action' => 'admin.login',
           'auditable_type' => User::class,
           'auditable_id' => $user->id,
           'old_values' => null,
           'new_values' => [
               'login' => true,
           ],
           'description' => 'Administrator logged in.',
           'ip_address' => $request->ip(),
           'user_agent' => $request->userAgent(),
       ]);

       return response()->json([
           'message' => 'Login successful.',
           'data' => [
               'token' => $token,
               'user' => [
                   'id' => $user->id,
                   'name' => $user->name,
                   'email' => $user->email,
                   'role' => $user->role->value,
               ],
           ],
       ]);
   }

public function logout(Request $request): JsonResponse
{
    $user = $request->user();

    AuditLog::create([
        'user_id' => $user->id,
        'action' => 'admin.logout',
        'auditable_type' => User::class,
        'auditable_id' => $user->id,
        'old_values' => null,
        'new_values' => [
            'logout' => true,
        ],
        'description' => 'Administrator logged out.',
        'ip_address' => $request->ip(),
        'user_agent' => $request->userAgent(),
    ]);

    $user->currentAccessToken()?->delete();

    return response()->json([
        'message' => 'Logout successful.',
    ]);
}

    public function me(
        Request $request
    ): JsonResponse {
        $user = $request->user();

        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role->value,
            ],
        ]);
    }
}
