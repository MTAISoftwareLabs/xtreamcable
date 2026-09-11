<?php

namespace App\Http\Controllers;

use App\Models\ContentCategory;
use Illuminate\Http\Request;

class ContentCategoryController extends Controller
{
    public function index() { return response()->json(['items' => ContentCategory::orderBy('created_at', 'desc')->get()]); }
    public function store(Request $request) { $item = ContentCategory::create($request->all()); return response()->json(['item' => $item], 201); }
    public function update(Request $request, $id) { $item = ContentCategory::findOrFail($id); $item->update($request->all()); return response()->json(['item' => $item]); }
    public function destroy($id) { ContentCategory::findOrFail($id)->delete(); return response()->noContent(); }
}
