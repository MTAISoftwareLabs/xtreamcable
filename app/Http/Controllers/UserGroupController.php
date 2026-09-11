<?php

namespace App\Http\Controllers;

use App\Models\UserGroup;
use Illuminate\Http\Request;

class UserGroupController extends Controller
{
    public function index() { return response()->json(['items' => UserGroup::orderBy('created_at', 'desc')->get()]); }
    public function store(Request $request) { $item = UserGroup::create($request->all()); return response()->json(['item' => $item], 201); }
    public function update(Request $request, $id) { $item = UserGroup::findOrFail($id); $item->update($request->all()); return response()->json(['item' => $item]); }
    public function destroy($id) { UserGroup::findOrFail($id)->delete(); return response()->noContent(); }
}
