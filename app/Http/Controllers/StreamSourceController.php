<?php

namespace App\Http\Controllers;

use App\Models\StreamSource;
use Illuminate\Http\Request;

class StreamSourceController extends Controller
{
    public function index() { return response()->json(['items' => StreamSource::orderBy('created_at', 'desc')->get()]); }
    public function store(Request $request) { $item = StreamSource::create($request->all()); return response()->json(['item' => $item], 201); }
    public function update(Request $request, $id) { $item = StreamSource::findOrFail($id); $item->update($request->all()); return response()->json(['item' => $item]); }
    public function destroy($id) { StreamSource::findOrFail($id)->delete(); return response()->noContent(); }
}
